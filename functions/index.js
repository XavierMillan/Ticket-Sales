'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { Logging } = require('@google-cloud/logging');
const logging = new Logging({
    projectId: process.env.GCLOUD_PROJECT,
});
const fs = require('fs');
const os = require('os');

const { Stripe } = require('stripe');
const stripe = new Stripe(functions.config().stripe.secret, {
    apiVersion: '2020-08-27',
});
var QRCode = require('qrcode')
// const firebase = require("firebase/compat");
// const MailComposer = require('nodemailer/lib/mail-composer');




//

var mailgun = require('mailgun-js')({
    apiKey: functions.config().mailgun.key,
    domain: functions.config().mailgun.domain,
});



//firebase functions:config:set mailgun.key=bacc88609af7e0960f9f6655a2f922b4-c76388c3-6a94a4e9
//firebase functions:config:set mailgun.domain=sandbox15c1e3ed2b5d4208966db4084c3fc7fa.mailgun.org
// firebase functions:config:set mailgun.domain=ticketing.venge.dev
// firebase functions:config:set mailgun.key=32bb4793e1a37b3fd3644f7f5845ef18-c76388c3-00f54647
//firebase functions:secrets:get mailgun.domain

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.beforeCreate = functions.auth.user().beforeCreate((user, context) => {
// (If the user is authenticating within a tenant context, the tenant ID can be determined from
// user.tenantId or from context.resource, e.g. 'projects/project-id/tenant/tenant-id-1')

// Only users of a specific domain can sign up.
if (user.email.indexOf('@gmail.com') === -1 && user.email.indexOf('@stanford.edu') === -1) {
    throw new functions.auth.HttpsError('invalid-argument', `Unauthorized email "${user.email}"`);
}
});



/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * When a user is created, create a Stripe customer object for them.
 *
 * @see https://stripe.com/docs/payments/save-and-reuse#web-create-customer
 */
exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {
    const customer = await stripe.customers.create({ email: user.email });
    const intent = await stripe.setupIntents.create({
        customer: customer.id,
    });
    await admin.firestore().collection('stripe_customers').doc(user.uid).set({
        customer_id: customer.id,
        setup_secret: intent.client_secret,
    });
    return;
});

/**
 * When adding the payment method ID on the client,
 * this function is triggered to retrieve the payment method details.
 */
exports.addPaymentMethodDetails = functions.firestore
    .document('/stripe_customers/{userId}/payment_methods/{pushId}')
    .onCreate(async (snap, context) => {
        try {
            const paymentMethodId = snap.data().id;
            const paymentMethod = await stripe.paymentMethods.retrieve(
                paymentMethodId
            );
            await snap.ref.set(paymentMethod);
            // Create a new SetupIntent so the customer can add a new method next time.
            const intent = await stripe.setupIntents.create({
                customer: `${paymentMethod.customer}`,
            });
            await snap.ref.parent.parent.set(
                {
                    setup_secret: intent.client_secret,
                },
                { merge: true }
            );
            return;
        } catch (error) {
            await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
            await reportError(error, { user: context.params.userId });
        }
    });

/**
 * When a payment document is written on the client,
 * this function is triggered to create the payment in Stripe.
 *
 * @see https://stripe.com/docs/payments/save-and-reuse#web-create-payment-intent-off-session
 */

// [START chargecustomer]

exports.createStripePayment = functions.firestore
    .document('stripe_customers/{userId}/payments/{pushId}')
    .onCreate(async (snap, context) => {

        //function to handle removing payments that are invalid or have failed
        function deleteDoc() {
            return snap.ref.delete();
        }
        //print user display name

        let payment_override = false;
        let only_guests_ticket = false;
        let only_users_ticket = false;
        let both_guests_and_users_ticket = false;

        let userInfo = await admin.auth().getUser(context.params.userId);
        //get user custom claim payment override
        admin.auth()
            .getUser(context.params.userId)
            .then((userRecord) => {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log("Successfully fetched user data:", userRecord.toJSON());
                if(userRecord.customClaims) {
                    if (userRecord.customClaims.payment_override) {
                        console.log("User has payment override");
                        payment_override = true;
                    } else {
                        console.log("User does not have payment override");
                    }
                }

                //get the amount vaue from all documents in the payments collection
                var amount = 0;

                admin.firestore()
                    .collection('stripe_customers')
                    .doc(context.params.userId)
                    .collection('payments')
                    .get()
                    .then(snapshot => {
                        //print snapshot size
                         console.log("User already has "+snapshot.size + " payments in account");
                         snapshot.forEach(doc => {
                             //if doc.data()error is null or not defined
                                if (!doc.data().error && !payment_override) {
                                    amount += doc.data().amount;
                                }
                         });
                         console.log('amount: ' + amount);
                         // if amout is greather than 2000 throw error
                         if (amount > 2000 && !payment_override) {
                            deleteDoc();
                            throw new functions.https.HttpsError('invalid-argument', 'Amount is greater than $20.00');
                         }


                        /*
                        get number of documents in tickets where buyerEmail = current user email
                        if depending on the number of documents in tickets, set the following variables
                        only_guests_ticket = true;
                        only_users_ticket = true;
                        both_guests_and_users_ticket = true;

                        if user is attampting to purchase unallowed tickets, throw error
                            */
                        admin.firestore()
                            .collection('tickets')
                            .where('buyerEmail', '==', userRecord.email)
                            .get()
                            .then((querySnapshot) => {
                                console.log('Number of tickets: ' + querySnapshot.size);
                                let numTickets = querySnapshot.size;
                                 if (numTickets === 0 && !payment_override) {
                                    //check if snap.data().metadata.buyerEmail buyerName buyerId are not null
                                    if (!snap.data().metadata.buyerEmail || !snap.data().metadata.buyerName || !snap.data().metadata.buyerId) {
                                        //throw error you buy buya ticket for yourself
                                         deleteDoc();
                                         throw new functions.https.HttpsError('invalid-argument', 'You must buy a ticket for yourself');
                                    }
                                    else if(snap.data().amount === 2000  && snap.data().metadata.buyerEmail && snap.data().metadata.buyerName && snap.data().metadata.buyerId && snap.data().metadata.guestEmail && snap.data().metadata.guestName ){
                                        // only_guests_ticket = true;
                                        both_guests_and_users_ticket = true;
                                    }
                                    else if( snap.data().amount === 1000 && snap.data().metadata.buyerEmail && snap.data().metadata.buyerName && snap.data().metadata.buyerId && !snap.data().metadata.guestEmail && !snap.data().metadata.guestName){
                                        only_users_ticket = true;
                                    }
                                    else{
                                        //throw error you buy buya ticket for yourself
                                        deleteDoc();
                                        throw new functions.https.HttpsError('invalid-argument', 'You must buy a ticket for yourself (fallback)');
                                    }

                                }
                                else if (numTickets === 1 && !payment_override) {
                                    //check that guest name and email are not null and buyer id is null
                                    if (!snap.data().metadata.guestName || !snap.data().metadata.guestEmail /*|| snap.data().metadata.buyerId*/) {
                                        //throw error you can only buy one ticket
                                        deleteDoc();
                                        throw new functions.https.HttpsError('invalid-argument', 'You can only buy one ticket for yourself');
                                    }
                                    else if(snap.data().amount === 1000 && snap.data().metadata.guestName && snap.data().metadata.guestEmail){
                                        only_guests_ticket = true;
                                    }
                                    else{
                                        //throw error you can only buy one ticket
                                        deleteDoc();
                                        throw new functions.https.HttpsError('invalid-argument', 'You can only buy one ticket for yourself (fallback)');
                                    }

                                }
                                else if (numTickets >= 2 && !payment_override) {
                                    console.log('User has exceeded ticket limit');
                                    deleteDoc();
                                    throw new functions.https.HttpsError('failed-precondition', 'User has exceeded ticket limit');
                                }
                            });
                    });
            });


        const { amount, currency, payment_method, receipt_email, metadata } = snap.data();
        try {
            /*
            Create a Description for the payment that will be shown to the user on their receipt
             */
            let description = '';
            if(only_guests_ticket) {
                description = `Payment for ${metadata.guestName} (${metadata.guestEmail})`;
                if (metadata.guestId) {
                    description = `${description} (${metadata.guestId})`;
                }
            }
            else if(only_users_ticket){
                description = `Payment for ${metadata.buyerName} (${metadata.buyerEmail})`;
                if (metadata.buyerId) {
                    description = `${description} (${metadata.buyerId})`;
                }
            }
            else{
                description = `Payment for ${metadata.buyerName} (${metadata.buyerEmail}) (${metadata.buyerId})`;
                //if guestName is not empty, add guestName to description
                if (metadata.guestName) {
                    description = `${description} and for ${metadata.guestName} (${metadata.guestEmail})`;
                    //if guestId is not empty, add guestId to description
                    if (metadata.guestId) {
                        description = `${description} (${metadata.guestId})`;
                    }
                }
            }
              //add payment.id to description
            description = `${description} | (Reference ID: ${snap.id})`;


            // Look up the Stripe customer id.
            const customer = (await snap.ref.parent.parent.get()).data().customer_id;
            // Create a charge using the pushId as the idempotency key
            // to protect against double charges.
            const idempotencyKey = context.params.pushId;
            const payment = await stripe.paymentIntents.create(
                {
                    amount,
                    currency,
                    customer,
                    payment_method,
                    receipt_email,
                    metadata,
                    description,
                    off_session: false,
                    confirm: true,
                    confirmation_method: 'manual',
                },
                { idempotencyKey }
            );

            //print ticket to console
            console.log(payment);


            // If the result is successful, write it back to the database.
            await snap.ref.set(payment)
                .then(() => {
                    //get buyerName and guestName from payment metadata
                    // const buyerName = payment.metadata.buyerName;
                    const buyerName = userInfo.displayName;
                    const guestName = payment.metadata.guestName;

                    //get buyerEmail and guestEmail from payment metadata
                    // const buyerEmail = payment.metadata.buyerEmail;
                    const buyerEmail = userInfo.email;
                    const guestEmail = payment.metadata.guestEmail;

                    //get buyerId and guestId from payment metadata
                    // const buyerId = payment.metadata.buyerId;
                    const buyerId = userInfo.customClaims.idnumber;
                    const guestId = payment.metadata.guestId;

                    //payment.id is the payment intent id
                    const paymentId = payment.id;

                    //get random number for ticket number
                    // const randomNumber = "|"+Math.floor(Math.random() * 1000000000000);

                    //check is payment is successful


                    const isSuccess = (payment.status === 'succeeded');
                    if(isSuccess) {
                        const amountReceived = payment.amount_received;
                        console.log('amount received: ' + amountReceived);

                        console.log("only_guests_ticket: " + only_guests_ticket);
                        console.log("only_users_ticket: " + only_users_ticket);
                        console.log("both_guests_and_users_ticket: " + both_guests_and_users_ticket);

                        //if only_guests_ticket is true amountReceived should be 1000 if not throw error
                        if((only_guests_ticket || only_users_ticket) && amountReceived !== 1000){
                            console.log('amount received for user or guest ticket is not 1000');
                            throw new functions.https.HttpsError('invalid-argument', 'amount received for user or guest ticket is not 1000');
                        }
                        //if both_guests_and_users_ticket is true amountReceived should be 2000 if not throw error
                        if(both_guests_and_users_ticket && amountReceived !== 2000){
                            console.log('amount received for both user and guest ticket is not 2000');
                            throw new functions.https.HttpsError('invalid-argument', 'amount received for both user and guest ticket is not 2000');
                        }


                        //user ticket
                        if(!only_guests_ticket && (only_users_ticket || both_guests_and_users_ticket)) {
                            var imgurl = "";
                            QRCode.toDataURL(paymentId , {errorCorrectionLevel: 'H'}, function (err, url) {
                                console.log(url);
                                url = url.split(",")[1];
                                console.log(url);
                                const buffer = Buffer.from(url, 'base64');
                                console.log(buffer);
                                //save buffer to txt file
                                fs.writeFileSync(os.tmpdir() + '/qr.jpg', buffer)
                                //send email with html
                                admin.storage().bucket('stripe-bb257.appspot.com').upload(os.tmpdir() + '/qr.jpg', {destination: paymentId  + 'qr.jpg'})
                                    .then(() => {
                                        console.log('Uploaded a blob or file!');
                                        admin.storage().bucket('stripe-bb257.appspot.com').file(paymentId  + 'qr.jpg').getSignedUrl({
                                            action: 'read',
                                            expires: '03-09-2491'
                                        }).then((results) => {
                                            imgurl = results[0];
                                            console.log(imgurl);
                                            //create a new document in the tickets collection with docid = payment.id
                                            admin.firestore().collection('tickets').doc(payment.id ).set({
                                                name: buyerName,
                                                email: buyerEmail,
                                                id: buyerId,
                                                qrcode: imgurl,
                                                buyerEmail: buyerEmail,
                                            });

                                        }).catch((error) => {
                                            console.log(error);
                                        });
                                    });
                            });

                        }





                        //guest ticket
                        if ((guestName && guestEmail && (both_guests_and_users_ticket || only_guests_ticket)) || payment_override) {

                            var imgurlguest ="";
                            QRCode.toDataURL(paymentId+'guest' ,{ errorCorrectionLevel: 'H' }, function (err, url) {
                                console.log(url);
                                url = url.split(",")[1];
                                console.log(url);
                                const bufferguest = Buffer.from(url, 'base64');
                                console.log(bufferguest);
                                //save buffer to txt file
                                fs.writeFileSync(os.tmpdir()+'/qrguest.jpg', bufferguest);

                                //create html with qr.jpg img
                                //upload qr.jpg to google cloud storage and get public url
                                //create html with public url
                                //send email with html
                                admin.storage().bucket('stripe-bb257.appspot.com').upload(os.tmpdir()+'/qrguest.jpg', {destination: paymentId+'qrguest.jpg'})
                                    .then(() => {
                                        console.log('Uploaded a blob or file!');
                                        admin.storage().bucket('stripe-bb257.appspot.com').file(paymentId+'qrguest.jpg').getSignedUrl({
                                            action: 'read',
                                            expires: '03-09-2491'
                                        }).then((results) => {
                                            imgurlguest = results[0];
                                            console.log(imgurlguest);
                                            admin.firestore().collection('tickets').doc(payment.id + 'guest' ).set({
                                                name: guestName,
                                                email: guestEmail,
                                                id: guestId,
                                                qrcode: imgurlguest,
                                                buyerEmail: buyerEmail,
                                            });

                                        }).catch((error) => {
                                            console.log(error);
                                        });
                                    });
                            });



                        }
                    }

                }).catch(error => {
                    console.log(error);
                });


        } catch (error) {
            // We want to capture errors and render them in a user-friendly way, while
            // still logging an exception to Error Reporting.
            functions.logger.log(error);
            await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
            await reportError(error, { user: context.params.userId });
        }
    });

// [END chargecustomer]

/**
 * When 3D Secure is performed, we need to reconfirm the payment
 * after authentication has been performed.
 *
 * @see https://stripe.com/docs/payments/accept-a-payment-synchronously#web-confirm-payment
 */
exports.confirmStripePayment = functions.firestore
    .document('stripe_customers/{userId}/payments/{pushId}')
    .onUpdate(async (change, context) => {
        if (change.after.data().status === 'requires_confirmation') {
            const payment = await stripe.paymentIntents.confirm(
                change.after.data().id
            );
            change.after.ref.set(payment);
        }
    });

/**
 * When a user deletes their account, clean up after them
 */
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
    const dbRef = admin.firestore().collection('stripe_customers');
    const customer = (await dbRef.doc(user.uid).get()).data();
    await stripe.customers.del(customer.customer_id);
    // Delete the customers payments & payment methods in firestore.
    const batch = admin.firestore().batch();
    const paymetsMethodsSnapshot = await dbRef
        .doc(user.uid)
        .collection('payment_methods')
        .get();
    paymetsMethodsSnapshot.forEach((snap) => batch.delete(snap.ref));
    const paymentsSnapshot = await dbRef
        .doc(user.uid)
        .collection('payments')
        .get();
    paymentsSnapshot.forEach((snap) => batch.delete(snap.ref));

    await batch.commit();

    await dbRef.doc(user.uid).delete();
    return;
});

/**
 * When a document is created in the tickets collection, send an email to the user.
 */
exports.sendTicket = functions.firestore
    .document('tickets/{ticketId}')
    .onWrite(async (change, context) => {
        const email = change.after.data().email;
        const name = change.after.data().name;
        const id = change.after.data().id;
        const qrcode = change.after.data().qrcode;

        const docId = context.params.ticketId;
        console.log(docId);

        //if the ticket has scanHistory, then it has been scanned and we don't need to send an email
        if (change.after.data().ticketHistory) {
            return;
        }


        let ticketid = change.after.id;

                        const htmlEmail = `<p>
                        Hi ${name},
                        <br><br>
                        You have successfully purchased a ticket for the event. 
                        <br><br>
                        Your ticket ID is ${ticketid} and your qr code to show at the door is below.
                        <br><br>
                        <img src="${qrcode}" alt="QR Code">
                        <br><br>
                        Thank you for buying a ticket for the event!
                        <br><br>
                        -The Event Organizer
                        </p> `;

                        const data = {
                            from: 'Ticket Confirmation <confirmation@ticketing.venge.dev> ',
                            to: name + '<' + email + '>',
                            subject: 'Ticket Confirmation',
                            html: htmlEmail
                        };
                        mailgun.messages().send(data, function (error, body) {
                            console.log(body);
                        });






    });

/*
Create a new ticket in the tickets collection
 */
exports.createTicket = functions.https.onCall( (data, context) => {
    //if the user is not authenticated, return an error
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'The function must be called while authenticated.'
        );
    }
    //if the user id not an admin or does not have payment override, return an error
    if (!context.auth.token.admin && !context.auth.token.payment_override) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'The function must be called by an admin or with payment override.'
        );
    }

    const email = data.email;
    const name = data.name;
    const id = data.id;
    const buyerEmail = data.buyerEmail;

    if(!email || !name || !buyerEmail || (email == buyerEmail && !id)){
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with a name, email, and buyerEmail.'
        );
    }

     // async function registerPayment(buyerEmail, name, id, email) {
        //if a user with the email buyerEmail does not exist, create one
        // try {
        //     admin.auth().createUser({
        //         email: buyerEmail,
        //         displayName: name,
        //     }).then((userRecord) => {
        //         //add custom claims to the user
        //         admin.auth().setCustomUserClaims(userRecord.uid, {
        //             idnumber: id,
        //         }).then(async () => {
        //             console.log('custom claims added to user');
        //
        //         });
        //     });
        // } catch (error) {
        //     console.log('user already exists');
        // }

        //get uid of user with email of buyerEmail
        admin.auth().getUserByEmail(buyerEmail).then((user) => {
        //if stripe_customers collection doesn't have a document with the uid, then the user hasn't purchased a ticket yet
       admin.firestore().collection('stripe_customers').doc(user.uid).get().then(
            (doc) => {
                if (doc.exists) {
                    //check the number of successful payments in the payments subcollection of customer
                    admin.firestore().collection('stripe_customers').doc(user.uid).collection('payments')
                        .where('status', '==', 'succeeded')
                        .get()
                        .then(async (querySnapshot) => {
                            console.log(querySnapshot.size);
                            if (querySnapshot.size >= 2) {
                                throw new functions.https.HttpsError(
                                    'permission-denied',
                                    'The user has already purchased max number of tickets.'
                                );
                            } else if (querySnapshot.size == 1 && email == buyerEmail) {
                                throw new functions.https.HttpsError(
                                    'permission-denied',
                                    'The user already has a ticket.'
                                );
                            } else if ((!querySnapshot ||querySnapshot.size == 0) && email != buyerEmail) {
                                throw new functions.https.HttpsError(
                                    'permission-denied',
                                    'The user has not purchased a ticket for themselves yet.'
                                );
                            } else {
                                //create a payment in the payments subcollection of customer
                                //get name of user with id of context.auth.uid
                                let sellerName = "";
                                admin.auth().getUser(context.auth.uid)
                                    .then((userRecord) => {
                                        //set sellerName to the name of the user
                                        sellerName = userRecord.displayName;
                                        admin.firestore().collection('stripe_customers').doc(user.uid).collection('payments').add({
                                            amount: 1000,
                                            currency: 'usd',
                                            status: 'succeeded',
                                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                                            type: 'cash',
                                            cashier: context.auth.token.email,
                                            cashierName: sellerName,
                                            cashierId: context.auth.token.uid,

                                        }).then((docRef) => {
                                            console.log("Payment written with ID: ", docRef.id);
                                        });
                                    });

                                let docId = "CASH_" + context.auth.token.uid + "_" + admin.firestore.Timestamp.now();
                                //create a ticket in the tickets collection
                                var imgurl ="";
                                QRCode.toDataURL(docId,{ errorCorrectionLevel: 'H' }, function (err, url) {
                                    console.log(url);
                                    url = url.split(",")[1];
                                    console.log(url);
                                    const buffer = Buffer.from(url, 'base64');
                                    console.log(buffer);
                                    //save buffer to txt file
                                    fs.writeFileSync(os.tmpdir()+'/qr.jpg', buffer);

                                    //create html with qr.jpg img
                                    //upload qr.jpg to google cloud storage and get public url
                                    //create html with public url
                                    //send email with html
                                    admin.storage().bucket('stripe-bb257.appspot.com').upload(os.tmpdir()+'/qr.jpg', {destination: id+'qr.jpg'})
                                        .then(() => {
                                            console.log('Uploaded a blob or file!');
                                            admin.storage().bucket('stripe-bb257.appspot.com').file(id+'qr.jpg').getSignedUrl({
                                                action: 'read',
                                                expires: '03-09-2491'
                                            }).then((results) => {
                                                imgurl = results[0];
                                                console.log(imgurl);
                                                //update the ticket with the qrcode
                                                admin.firestore().collection('tickets').doc(docId).set({
                                                    email: email,
                                                    name: name,
                                                    id: id,
                                                    buyerEmail: buyerEmail,
                                                    qrcode: imgurl,
                                                }).then(() => {
                                                    console.log('created ticket with qrcode');
                                                    //return message to client
                                                    return {
                                                        message: 'Ticket created successfully',
                                                    }


                                                }).catch((error) => {
                                                    console.log("there was an error creating the ticket");
                                                    console.log(error);
                                                    throw new functions.https.HttpsError(
                                                        'internal',
                                                        'There was an error creating the ticket.'
                                                    );
                                                });
                                                //update the current file with the qrcode field




                                            }).catch((error) => {
                                                console.log(error);
                                            });
                                        });
                                });
                            }
                        });
                }


            });
    // }

        });


});


/*
A function to set a custom claim of idnumber on the user's id token
 */
exports.setIdNumber = functions.https.onCall(async (data, context) => {
    const uid = context.auth.uid;
    const idNumber = data.idnumber;
    const user = await admin.auth().getUser(uid);
    await admin.auth().getUser(uid)
        .then(userRecord => {
            //if the user has a custom claim of idnumber, update it to the new value while preserving the other claims
            if (userRecord.customClaims) {
                const customClaims = userRecord.customClaims;
                customClaims.idnumber = idNumber;
                return admin.auth().setCustomUserClaims(uid, customClaims);
            }
            //if the user does not have a custom claim of idnumber, while preserving the other claims, add the idnumber claim
            else {
                return admin.auth().setCustomUserClaims(uid, { idnumber: idNumber, ...userRecord.customClaims });
            }

        }).catch(error => {
        console.log("Error fetching user data:", error);
        return { error };
    });
});

/*
A fucntion that creates a user with the email name and idnumber passed in
firebase deploy --only functions:createUserWithData
 */
exports.createUserWithData = functions.https.onCall(async (data, context) => {
    const email = data.email;
    //if email does net end with @gmail.com or @stanford.edu, return an error
    if (!email.endsWith('@gmail.com') && !email.endsWith('@stanford.edu') || !email) {
        return { error: 'Please use a valid email' };
    }
    const name = data.name;
    if(!name){
        return { error: 'Please enter a name' };
    }
    const idNumber = data.idnumber;
    if(!idNumber){
        return { error: 'Please enter an ID number' };
    }



    console.log(email);
    console.log(name);
    console.log(idNumber);
    //generate a random password
    const password = Math.random().toString(36).slice(-8);
    const user = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name
    }).then(userRecord => {
        //add the idnumber claim to the user
        admin.auth().setCustomUserClaims(userRecord.uid, { idnumber: idNumber }).then(() => {
            const actionCodeSettings = {
                url: 'https://stripe-bb257.firebaseapp.com/login.html',
                handleCodeInApp: true,
            }
            admin.auth().generateSignInWithEmailLink(email, actionCodeSettings).then(link => {
                let htmlEmail = `<p>
            Hi ${name},
            <br><br>
            We received a request to create an account for you on the event ticketing website using this email address. If you want to sign in with you ${email} account, click this link:
            <br><br>
            <a href="${link}">Sign in to Store</a>
            <br><br>
            If you did not make this request, you can safely ignore this email.
            <br><br>
            Thanks,
            <br><br>
            The Store Team
            </p> `;



                const data = {
                    from: 'noreply <noreply@ticketing.venge.dev> ',
                    to: name + '<' + email + '>',
                    subject: 'Sign in to your new Ticket account',
                    html: htmlEmail
                };
                mailgun.messages().send(data, function (error, body) {
                    console.log(body);
                    return {message: "Account created successfully. Please check your email to sign in."};


                });
            }).catch(error => {
                console.log("Error generating sign in link:", error);
                return { error };
            })



        }).catch(error => {
            console.log("Error setting custom claims:", error);
            return { error };
        });
    }).catch(error => {
        console.log("Error creating new user:", error);
        return { error };
    });
    // //then send a login email to the user to sign in
    // const actionCodeSettings = {
    //     url: 'https://stripe-bb257.firebaseapp.com/login.html',
    //     handleCodeInApp: true,
    // }
    // await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

    //return an error has occured
    return {message: "Account created successfully. Please check your email to sign in."};
});


/*
let customClaims = {
                idnumber: idNumber
            };
            console.log(customClaims);
            //save custom claims to object
            try {
                customClaims = userRecord.customClaims;
                //remove idnumber claim
                delete customClaims.idnumber;
                console.log(customClaims);
            } catch (e) {
                console.log(e);
            }

            customClaims.idnumber = idNumber;
            console.log(customClaims);
            admin.auth().setCustomUserClaims(uid, null)
                .then(() => {
                    admin.auth().setCustomUserClaims(uid, customClaims)
                        .then(() => {
                            console.log("Successfully set custom claims");
                            return { message: `Successfully set Id Number` };
                        }).catch(error => {
                        console.log("Error setting custom claims:", error);
                        return { error };
                    });
                });
 */


/**
 * To keep on top of errors, we should raise a verbose error report with Error Reporting rather
 * than simply relying on functions.logger.error. This will calculate users affected + send you email
 * alerts, if you've opted into receiving them.
 */

// [START reporterror]

function reportError(err, context = {}) {
    // This is the name of the log stream that will receive the log
    // entry. This name can be any valid log stream name, but must contain "err"
    // in order for the error to be picked up by Error Reporting.
    const logName = 'errors';
    const log = logging.log(logName);

    // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
    const metadata = {
        resource: {
            type: 'cloud_function',
            labels: { function_name: process.env.FUNCTION_NAME },
        },
    };

    // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
    const errorEvent = {
        message: err.stack,
        serviceContext: {
            service: process.env.FUNCTION_NAME,
            resourceType: 'cloud_function',
        },
        context: context,
    };

    // Write the error log entry
    return new Promise((resolve, reject) => {
        log.write(log.entry(metadata, errorEvent), (error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
}

// [END reporterror]

/**
 * Sanitize the error message for the user.
 */
function userFacingMessage(error) {
    return error.type
        ? error.message
        : 'An error occurred, developers have been alerted';
}