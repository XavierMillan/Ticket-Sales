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
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51L1XR0GAxmEjxM1Wn7MNcmM8nAj1o9U1GBAkgye7xoLMUA2LTnpcOZvuZxvEzNLSKoCclGS4HTeTuURsLJUxFB4900ARPsQgW3';
let currentUser = {};
let customerData = {};

const config = {
    apiKey: "AIzaSyBQbyfhDHOqNNKTVGjYuGJs3lBykdp9SKM",
    authDomain: "stripe-bb257.firebaseapp.com",
    projectId: "stripe-bb257",
    storageBucket: "stripe-bb257.appspot.com",
    messagingSenderId: "806611367820",
    appId: "1:806611367820:web:e554f48f3a6c9c655b08a9",
    measurementId: "G-WXK2DY6LRL"
};

firebase.initializeApp(config);

//set name1 and email1 to the current user's name and email
function setNameAndEmail() {
    document.querySelector('#name1').value = currentUser.displayName;
    document.querySelector('#email1').value = currentUser.email;
    console.log(currentUser.displayName);
    console.log(currentUser.email);

    //get idnumber custom claim
    firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
        if (idTokenResult.claims.idnumber) {
            document.querySelector('#id1').value = idTokenResult.claims.idnumber;
            document.getElementById("id1").value = idTokenResult.claims.idnumber;
            console.log(idTokenResult.claims.idnumber);
        }
    });



}




/**
 * Firebase auth configuration
 */
const firebaseUI = new firebaseui.auth.AuthUI(firebase.auth());
const firebaseUiConfig = {
    callbacks: {

        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            return true;
        },
        uiShown: () => {
            document.getElementById('loader').style.display = 'none';

        },
    },
    signInFlow: 'popup',
    signInSuccessUrl: '/',
    signInOptions: [
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    // Your terms of service url.
    tosUrl: 'https://example.com/terms',
    // Your privacy policy url.
    privacyPolicyUrl: 'https://example.com/privacy',
};

firebase.auth().onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
        //if user does not have a name set error-content innerHTML to "Please set a name in your profile <a href="account.html">here</a>"


        // currentUser = firebaseUser;
        // firebase
        //     .firestore()
        //     .collection('stripe_customers')
        //     .doc(currentUser.uid)
        //     .onSnapshot((snapshot) => {
        //         if (snapshot.data()) {
        //             setNameAndEmail();
        //             customerData = snapshot.data();
        //             startDataListeners();
        //             document.getElementById('loader').style.display = 'none';
        //             // document.getElementById('content').style.display = 'block';
        //
        //         } else {
        //             console.warn(
        //                 `No Stripe customer found in Firestore for user: ${currentUser.uid}`
        //             );
        //         }
        //     });

        //get idnumber custom claim
        firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
            //if has idnumber claim AND name is set
            if (!idTokenResult.claims.payment_override) {
                //redirect to store.html
                window.location.href = "store.html";
            }else{
                document.querySelector('#content').style.display = 'block';
            }

        });

        // if (firebaseUser.displayName == null) {
        //     document.querySelector('#error-content').innerHTML = "Please set a name in your profile <a href='account.html'>here</a>";
        //     //hide content
        //     document.querySelector('#content').style.display = 'none';
        // }
        // else{
        //     document.querySelector('#content').style.display = 'block';
        // }

    } else {
        document.getElementById('content').style.display = 'none';
        // firebaseUI.start('#firebaseui-auth-container', firebaseUiConfig);
        //redirect to login page
        window.location.href = "login.html?redirect=store";
    }
});

/**
 * Set up Stripe Elements
 */
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();

const cardElement = elements.create('card');
// cardElement.mount('#card-element');
cardElement.on('change', ({ error }) => {
    const displayError = document.getElementById('error-message');
    if (error) {
        displayError.textContent = error.message;
    } else {
        displayError.textContent = '';
    }
});






/**
 * Set up Firestore data listeners
 */

// function startDataListeners() {
//     /**
//      * Get all payment methods for the logged in customer
//      */
//     firebase
//         .firestore()
//         .collection('stripe_customers')
//         .doc(currentUser.uid)
//         .collection('payment_methods')
//         .onSnapshot((snapshot) => {
//             if (snapshot.empty) {
//                 document.querySelector('#add-new-card').open = true;
//             }
//             snapshot.forEach(function (doc) {
//                 const paymentMethod = doc.data();
//                 if (!paymentMethod.card) {
//                     return;
//                 }
//
//                 const optionId = `card-${doc.id}`;
//                 let optionElement = document.getElementById(optionId);
//
//                 // Add a new option if one doesn't exist yet.
//                 if (!optionElement) {
//                     optionElement = document.createElement('option');
//                     optionElement.id = optionId;
//                     document
//                         .querySelector('select[name=payment-method]')
//                         .appendChild(optionElement);
//                 }
//
//                 optionElement.value = paymentMethod.id;
//                 optionElement.text = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`;
//             });
//         });
//
//     /**
//      * Get all payments for the logged in customer
//      */
//     firebase
//         .firestore()
//         .collection('stripe_customers')
//         .doc(currentUser.uid)
//         .collection('payments')
//         // .orderBy('created', 'desc')
//         .onSnapshot((snapshot) => {
//             //get number of documents in the collection
//             let numPayments = snapshot.size;
//             //count all paymments without an error
//             let numPaymentsWithoutError = 0;
//             snapshot.forEach(function (doc) {
//                 const payment = doc.data();
//                 if (!payment.error) {
//                     numPaymentsWithoutError++;
//                 }
//             });
//             numPayments = numPaymentsWithoutError;
//
//             console.log("Number of Payments: "+numPayments);
//
//             //if there are no documents in the collection, display a message
//             if (numPayments == 0) {
//                 //set payments message innerHTML to You have no payments yet
//                 document.getElementById("payments-message").innerHTML = "You have no payments yet";
//             }
//             else{
//                 //set payments message innerHTML to Your Payments
//                 document.getElementById("payments-message").innerHTML = "";
//             }
//
//
//             //if there are no documents, display a message
//             //for each document get the amount and add it to the total
//
//             var amount = 0;
//             snapshot.forEach(doc => {
//                 //if doc.data()error is null or not defined
//                 if (!doc.data().error) {
//                     // amount += doc.data().amount;
//                     amount += doc.data().amount_received;
//                 }
//             });
//             console.log("Amount: "+amount);
//
//             //get user custom claim payment_override
//             //get number of tickets from firestore with buyerEmail = currentUser.email
//             let numTickets = 0;
//             firebase.firestore().collection('tickets').where('buyerEmail', '==', currentUser.email).get().then((querySnapshot) => {
//                 //set numTickets to the number of tickets the user has
//                 numTickets = querySnapshot.size;
//                 //print numTickets
//                 console.log("Number of Tickets: "+numTickets);
//
//
//
//                 firebase
//                     .auth()
//                     .currentUser.getIdTokenResult()
//                     .then((idTokenResult) => {
//                         console.log(idTokenResult.claims.payment_override);
//                         const paymentOverride = idTokenResult.claims.payment_override;
//
//                         //get number of payments for the logged in customer
//
//
//                         function validateField(field) {
//                             field.addEventListener("input", (event) => {
//                                 console.log("Field: "+field.value);
//                                 if (field.validity.typeMismatch) {
//                                     if(field.type == "email") {
//                                         field.setCustomValidity("Enter a valid e-mail address");
//                                     }
//                                     else if(field.type == "number") {
//                                         field.setCustomValidity("Enter valid a number");
//                                     }
//                                     else{
//                                         field.setCustomValidity("Enter a valid value");
//                                     }
//                                     field.reportValidity();
//                                     return false;
//                                 } else {
//                                     field.setCustomValidity("");
//                                     return true;
//                                 }
//                             });
//                         }
//
//                         if((numTickets === 0 && numPayments === 0 && amount === 0)){
//                             console.log("No tickets and no payments");
//
//
//                             // document.querySelector('#payments-list').innerHTML = `<p>You have not purchased any tickets yet.</p>`;
//                             //show the payment panel
//                             document.querySelector('#payment-panel').style.display = 'block';
//
//                             //show showt1
//                             document.getElementById("showt1").style.display = 'block';
//
//                             //add event listener to save
//                             document.querySelector('#save').addEventListener('click', () => {
//
//                                 const email1 = document.getElementById("email1");
//
//                                 const name1 = document.getElementById("name1");
//
//                                 const id1 = document.getElementById("id1");
//
//                                 //get data-state attribute of save button
//                                 const state = document.querySelector('#save').getAttribute('data-state');
//                                 if (state === 'active') {
//
//                                     //add datafield to save button
//                                     document.querySelector('#save').setAttribute('data-state', 'saved');
//
//                                     //get all inputs in ticket-fields
//                                     const inputs = document.querySelectorAll('#ticket-fields input');
//                                     //for each input
//                                     inputs.forEach(input => {
//                                         //disable the input
//                                         input.disabled = true;
//                                     });
//                                     //set innerHTML of save button to Edit
//                                     document.querySelector('#save').value = "Edit Ticket Information";
//                                     //make button green
//                                     document.querySelector('#save').style.backgroundColor = "#4CAF50";
//
//                                     //show payment-fulfillment
//                                     document.querySelector('#payment-fulfillment').style.display = 'block';
//                                     //set final-amount value to total-amount value
//                                     console.log("Total Amount: " + document.querySelector('#total-amount').innerHTML);
//                                     document.querySelector('#final-total').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML);
//
//
//                                 } else if (state === 'saved') {
//                                     //add datafield to save button
//                                     document.querySelector('#save').setAttribute('data-state', 'active');
//
//                                     //get all inputs in ticket-fields
//                                     const inputs = document.querySelectorAll('#ticket-fields input');
//                                     //for each input
//                                     inputs.forEach(input => {
//                                         //enable the input
//                                         input.disabled = false;
//                                     });
//                                     //set innerHTML of save button to Save
//                                     document.querySelector('#save').value = "Save Ticket Information";
//                                     //make button blue
//                                     document.querySelector('#save').style.backgroundColor = "#0070f3";
//                                     //hide payment-fulfillment
//                                     document.querySelector('#payment-fulfillment').style.display = 'none';
//
//                                 }
//
//
//
//                             });
//
//
//                             //add event listener to the showt1 button
//                             document.querySelector('#showt1').addEventListener('click', (e) => {
//                                 //if ticket1 display is none set it to block
//                                 if(document.querySelector('#ticket1').style.display === 'none'){
//                                     console.log("Ticket 1 is hidden");
//                                     //add 10 to totalamount value
//                                     document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;
//
//                                     document.querySelector('#ticket1').style.display = 'block';
//                                     //set value of showt1 button to Remove Ticket1
//                                     document.querySelector('#showt1').value = 'Remove Your Ticket ($10)';
//                                     //make button red
//                                     document.querySelector('#showt1').style.backgroundColor = 'red';
//                                     //remove disabeled from showt2 button
//                                     document.querySelector('#showt2').disabled = false;
//                                     //enable save button
//                                     document.querySelector('#save').disabled = false;
//
//                                 }
//                                 else{
//                                     console.log("OTHER");
//
//                                     //subtract 10 from totalamount value
//                                     // document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;
//                                     document.querySelector('#total-amount').innerHTML = 0;
//
//                                     document.querySelector('#ticket1').style.display = 'none';
//                                     //set value of showt1 button to Add Ticket1
//                                     document.querySelector('#showt1').value = 'Add Your Ticket ($10)';
//                                     //make button 0070F3
//                                     document.querySelector('#showt1').style.backgroundColor = '#0070F3';
//                                     //add disabeled to showt2 button
//                                     document.querySelector('#showt2').disabled = true;
//                                     //hide ticket2
//                                     document.querySelector('#ticket2').style.display = 'none';
//
//                                     document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
//                                     //make button 0070F3
//                                     document.querySelector('#showt2').style.backgroundColor = '#0070F3';
//
//                                     //disable save button
//                                     document.querySelector('#save').disabled = true;
//
//
//
//                                 }
//                                 //if checkout display is hidden set it to block
//                                 if(document.querySelector('#charge').style.display === 'none'){
//                                     document.querySelector('#charge').style.display = 'block';
//                                 }
//
//                             });
//
//                             //add event listener to the showt2 button
//                             document.querySelector('#showt2').addEventListener('click', (e) => {
//                                 //if ticket2 display is none set it to block
//                                 if(document.querySelector('#ticket2').style.display === 'none'){
//
//                                     document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;
//
//                                     document.querySelector('#ticket2').style.display = 'block';
//                                     //set value of showt2 button to Remove Ticket2
//                                     document.querySelector('#showt2').value = 'Remove Guest Ticket ($10)';
//                                     //make button red
//                                     document.querySelector('#showt2').style.backgroundColor = 'red';
//                                 }
//                                 else{
//                                     //subtract 10 from totalamount value
//                                     document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;
//
//                                     document.querySelector('#ticket2').style.display = 'none';
//                                     //set value of showt2 button to Add Ticket2
//                                     document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
//                                     //make button 0070F3
//                                     document.querySelector('#showt2').style.backgroundColor = '#0070F3';
//                                 }
//                                 //if checkout display is hidden set it to block
//                                 if(document.querySelector('#charge').style.display === 'none'){
//                                     document.querySelector('#charge').style.display = 'block';
//                                 }
//                             });
//
//
//
//                         }
//                         else if ((numTickets >= 2 || numPayments >= 2 || amount >= 2000) && !paymentOverride) {
//                             console.log('too many tickets or payments');
//
//                             document.querySelector('#message').innerHTML =
//                                 'You can view your ticket(s) <a href="tickets.html">here</a>.';
//                             //hide payment-panel
//                             document.querySelector('#payment-panel').style.display = 'none';
//                             //make all form fields readonly
//                             document.querySelectorAll('input').forEach(function (input) {
//                                 input.readOnly = true;
//                                 //clear values
//                                 input.value = "";
//                             });
//                         }
//                     else if (numTickets === 1 || numPayments === 1 || amount === 1000 || paymentOverride) {
//                         console.log('one ticket or payment');
//
//                             document.querySelector('#payment-panel').style.display = 'block';
//                             document.querySelector('#message').innerHTML =
//                                 'You can view your ticket(s) <a href="tickets.html">here</a>.';
//
//                             //hide show t1
//                             document.querySelector('#showt1').style.display = 'none';
//                             //make showt2 enabled
//                             document.querySelector('#showt2').disabled = false;
//
//
//
//                                 document.querySelector('#save').addEventListener('click', () => {
//                                     console.log('save button clicked');
//                                     //get name2 email2 and id2
//                                     // let name2 = document.querySelector('#name2').value;
//                                     // let email2 = document.querySelector('#email2').value;
//                                     // let id2 = document.querySelector('#id2').value;
//                                     const email2 = document.getElementById("email2");
//
//                                     const name2 = document.getElementById("name2");
//
//                                     const id2 = document.getElementById("id2");
//
//
//                                     //get data-state attribute of save button
//                                     const state = document.querySelector('#save').getAttribute('data-state');
//                                     if (!name2 || !email2) {
//                                         alert('Please fill out all fields');
//                                     }
//
//                                     if (state === 'active' && name2 && email2) {
//
//                                         //add datafield to save button
//                                         document.querySelector('#save').setAttribute('data-state', 'saved');
//
//                                         //get all inputs in ticket-fields
//                                         const inputs = document.querySelectorAll('#ticket-fields input');
//                                         //for each input
//                                         inputs.forEach(input => {
//                                             //disable the input
//                                             input.disabled = true;
//                                         });
//                                         //set innerHTML of save button to Edit
//                                         document.querySelector('#save').value = "Edit Ticket Information";
//                                         //make button green
//                                         document.querySelector('#save').style.backgroundColor = "#4CAF50";
//
//                                         //show payment-fulfillment
//                                         document.querySelector('#payment-fulfillment').style.display = 'block';
//                                         //set final-amount value to total-amount value
//                                         console.log("Total Amount: " + document.querySelector('#total-amount').innerHTML);
//                                         document.querySelector('#final-total').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML);
//
//
//                                     } else if (state === 'saved') {
//                                         //add datafield to save button
//                                         document.querySelector('#save').setAttribute('data-state', 'active');
//
//                                         //get all inputs in ticket-fields
//                                         const inputs = document.querySelectorAll('#ticket-fields input');
//                                         //for each input
//                                         inputs.forEach(input => {
//                                             //enable the input
//                                             input.disabled = false;
//                                         });
//                                         //set innerHTML of save button to Save
//                                         document.querySelector('#save').value = "Save Ticket Information";
//                                         //make button blue
//                                         document.querySelector('#save').style.backgroundColor = "#0070f3";
//                                         //hide payment-fulfillment
//                                         document.querySelector('#payment-fulfillment').style.display = 'none';
//
//                                     }
//
//                                     //hide showt1
//                                     // document.querySelector('#showt1').style.display = 'none';
//                                     // //enable showt2
//                                     // document.querySelector('#showt2').disabled = false;
//                                     //
//                                     // document.querySelector('#showt2').addEventListener('click', (e) => {
//                                     //     //if ticket2 display is none set it to block
//                                     //     if(document.querySelector('#ticket2').style.display === 'none'){
//                                     //
//                                     //         document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;
//                                     //
//                                     //         document.querySelector('#ticket2').style.display = 'block';
//                                     //         //set value of showt2 button to Remove Ticket2
//                                     //         document.querySelector('#showt2').value = 'Remove Guest Ticket ($10)';
//                                     //         //make button red
//                                     //         document.querySelector('#showt2').style.backgroundColor = 'red';
//                                     //     }
//                                     //     else{
//                                     //         //subtract 10 from totalamount value
//                                     //         document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;
//                                     //
//                                     //         document.querySelector('#ticket2').style.display = 'none';
//                                     //         //set value of showt2 button to Add Ticket2
//                                     //         document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
//                                     //         //make button 0070F3
//                                     //         document.querySelector('#showt2').style.backgroundColor = '#0070F3';
//                                     //     }
//                                     //     //if checkout display is hidden set it to block
//                                     //     if(document.querySelector('#charge').style.display === 'none'){
//                                     //         document.querySelector('#charge').style.display = 'block';
//                                     //     }
//                                     // });
//
//
//                                 });
//
//
//
//                             //add event listener to the showt2 button
//                             document.querySelector('#showt2').addEventListener('click', (e) => {
//                                 //if ticket2 display is none set it to block
//                                 if(document.querySelector('#ticket2').style.display === 'none'){
//
//                                     document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;
//
//                                     document.querySelector('#ticket2').style.display = 'block';
//                                     //set value of showt2 button to Remove Ticket2
//                                     document.querySelector('#showt2').value = 'Remove Guest Ticket ($10)';
//                                     //make button red
//                                     document.querySelector('#showt2').style.backgroundColor = 'red';
//
//                                     //enable save button
//                                     document.querySelector('#save').disabled = false;
//                                 }
//                                 else{
//                                     //subtract 10 from totalamount value
//                                     document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;
//
//                                     document.querySelector('#ticket2').style.display = 'none';
//                                     //set value of showt2 button to Add Ticket2
//                                     document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
//                                     //make button 0070F3
//                                     document.querySelector('#showt2').style.backgroundColor = '#0070F3';
//                                     //disable save button
//                                     document.querySelector('#save').disabled = true;
//
//                                 }
//                                 //if checkout display is hidden set it to block
//                                 if(document.querySelector('#charge').style.display === 'none'){
//                                     document.querySelector('#charge').style.display = 'block';
//                                 }
//                             });
//
//
//
//
//                             }
//
//
//
//
//                             /*
//                             !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//                              */
//
//
//
//
//
//
//
//
//
//
//                             //hide showt1 button
//                             // document.querySelector('#showt1').style.display = 'none';
//                             //set name1 email1 and id1 value to null
//                             // document.querySelector('#name1').value = '';
//                             // document.querySelector('#email1').value = '';
//                             // document.querySelector('#id1').value = '';
//
//                             //enable showt2 button
//                             // document.querySelector('#showt2').disabled = false;
//
//
//                             /*
//                             //add event listener to the showt1 button
//                             document.querySelector('#showt1').addEventListener('click', (e) => {
//                                 //if ticket1 display is none set it to block
//                                 if(document.querySelector('#ticket1').style.display === 'none'){
//                                     //add 10 to totalamount value
//                                     document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;
//
//                                     document.querySelector('#ticket1').style.display = 'block';
//                                     //set value of showt1 button to Remove Ticket1
//                                     document.querySelector('#showt1').value = 'Remove Your Ticket ($10)';
//                                     //make button red
//                                     document.querySelector('#showt1').style.backgroundColor = 'red';
//                                     //remove disabeled from showt2 button
//                                     document.querySelector('#showt2').disabled = false;
//                                     //enable save button
//                                     document.querySelector('#save').disabled = false;
//
//                                 }
//                                 else{
//
//                                     //subtract 10 from totalamount value
//                                     // document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;
//                                     document.querySelector('#total-amount').innerHTML = 0;
//
//                                     document.querySelector('#ticket1').style.display = 'none';
//                                     //set value of showt1 button to Add Ticket1
//                                     document.querySelector('#showt1').value = 'Add Your Ticket ($10)';
//                                     //make button 0070F3
//                                     document.querySelector('#showt1').style.backgroundColor = '#0070F3';
//                                     //add disabeled to showt2 button
//                                     document.querySelector('#showt2').disabled = true;
//                                     //hide ticket2
//                                     document.querySelector('#ticket2').style.display = 'none';
//
//                                     document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
//                                     //make button 0070F3
//                                     document.querySelector('#showt2').style.backgroundColor = '#0070F3';
//
//                                     //disable save button
//                                     document.querySelector('#save').disabled = true;
//
//
//
//                                 }
//                                 //if checkout display is hidden set it to block
//                                 if(document.querySelector('#charge').style.display === 'none'){
//                                     document.querySelector('#charge').style.display = 'block';
//                                 }
//
//                             });
// */
//
//
//
//
//
//
//                             /*
//                             //set input with name amount max to 1
//                             document.querySelector('input[name=amount]').max = 1;
//                             //hide ticket1
//                             document.querySelector('#ticket1').style.display = 'none';
//
//
//                             document.getElementById("amount").addEventListener("change", function(){
//                                     console.log(this.value);
//                                     //set total amount to the value of the field times 10
//                                     document.getElementById("total-amount").innerHTML = this.value * 10;
//                                     //if the value is 1 show the first ticket form
//                                     if(this.value == 0){
//                                         document.getElementById("ticket1").style.display = "none";
//                                         document.getElementById("ticket2").style.display = "none";
//                                         //hide charge button
//                                         document.getElementById("charge").style.display = "none";
//
//                                     }
//
//                                     else if(this.value == 1){
//                                         document.getElementById("ticket1").style.display = "none";
//                                         document.getElementById("ticket2").style.display = "block";
//                                         //set id1 to readonly
//                                         document.getElementById("id1").readOnly = true;
//                                         //clear id1
//                                         document.getElementById("id1").value = "";
//                                         //set email2 and name2 to required
//                                         document.getElementById("email2").required = true;
//                                         document.getElementById("name2").required = true;
//                                         document.getElementById("charge").style.display = "block";
//
//                                     }
//
//
//                                 }
//                             );
//
//                             */
//
//
//
//
//
//
//
//
//                         // }
//
//
//                         // if ((length > 0 && !paymentOverride) || length >= 2 && paymentOverride) {
//                         //     console.log( length + " payments" + " and payment_override is " + paymentOverride + " so hide the payment form");
//                         //     document.querySelector('#payment-panel').style.display =
//                         //         'none';
//                         //     //set message to you have already bought your ticket(s) view them <a href="/payments">here</a>
//                         //
//                         //     //hide payment method selection
//                         //
//                         // }
//                         // else{
//                         //     //showpayment-panel
//                         //     document.querySelector('#payment-panel').style.display = 'block';
//                         //     //
//                         //
//                         //
//                         // }
//
//
//
//                     });
//
//
//
//
//
//             });
//
//
//
//
//
//             //sort snapshot by created in descending order but if field is missing have it be first
//
//
//             //order snapshot by field created in descending order
//             snapshot = snapshot.docs.sort((a, b) => {
//                 //if field is missing, have it be first
//                 if (!a.data().created) {
//                     return -1;
//                 }
//                 if (!b.data().created) {
//                     return 1;
//                 }
//                 if (a.data().created < b.data().created) {
//                     return 1;
//                 }
//                 if (a.data().created > b.data().created) {
//                     return -1;
//                 }
//                 return 0;
//             });
//
//
//
//
//             snapshot.forEach((doc) => {
//                 const payment = doc.data();
//
//                 let liElement = document.getElementById(`payment-${doc.id}`);
//                 if (!liElement) {
//                     liElement = document.createElement('li');
//                     liElement.id = `payment-${doc.id}`;
//                 }
//
//                 let content = '';
//                 if (
//                     (payment.status === 'new' ||
//                     payment.status === 'requires_confirmation') &&
//                     !payment.error
//                 ) {
//                     content = `Processing Payment for ${formatAmount(
//                         payment.amount,
//                         payment.currency
//                     )}`;
//                 } else if (payment.status === 'succeeded') {
//                     //get recept url
//                     const receiptUrl = payment.charges.data[0].receipt_url;
//                     const createdAt = payment.created *1000;
//                     // console.log(createdAt);
//                     //get current time zone
//                     const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//                     // console.log(timeZone);
//                     //convert createdAt to local time
//                     const localCreatedAt = new Date(createdAt).toLocaleString('en-US', {
//                         timeZone,
//                         hour12: true,
//                         month: 'long',
//                         day: 'numeric',
//                         hour: 'numeric',
//                         minute: 'numeric',
//                         second: 'numeric',
//                     });
//
//
//                     const card = payment.charges.data[0].payment_method_details.card;
//                     content = `<a href="${receiptUrl}" target="_blank">✅ ${localCreatedAt} - Payment for ${formatAmount(
//                         payment.amount,
//                         payment.currency
//                     )} on ${card.brand} card •••• ${card.last4}.</a>`;
//                 } else if (payment.status === 'requires_action') {
//                     content = `🚨 Payment for ${formatAmount(
//                         payment.amount,
//                         payment.currency
//                     )} ${payment.status}`;
//                     handleCardAction(payment, doc.id);
//                 }
//                 //else if payment.error is not null, display error message
//                 else if (payment.error) {
//                     //if doc does not have a created field add current time to doc in database
//                     if (!payment.created) {
//                         let createdfallback = Date.now()/1000;
//                         firebase
//                             .firestore()
//                             .collection('stripe_customers')
//                             .doc(currentUser.uid)
//                             .collection('payments')
//                             .doc(doc.id)
//                             .update({
//                                 created: createdfallback,
//                             });
//
//                     }
//                     try {
//                         content = `❌  ${payment.error} - Payment for ${formatAmount(
//                             payment.amount,
//                             payment.currency
//                         )} `;
//                     } catch (error) {
//                         console.log(error);
//                     }
//                 }
//
//                 else {
//                     content = `⚠️ Payment for ${formatAmount(
//                         payment.amount,
//                         payment.currency
//                     )} ${payment.status}`;
//                 }
//                 // liElement.innerText = content;
//                 liElement.innerHTML = content;
//                 document.querySelector('#payments-list').appendChild(liElement);
//             });
//         });
// }

/**
 * Event listeners
 */

// Signout button
// document
//     .getElementById('signout')
//     .addEventListener('click', () => {
//             firebase.auth().signOut();
//             //reload page
//             location.reload();
//         }
//     );

//tickets button
// document
//     .getElementById('tickets')
//     .addEventListener('click', () => {
//         window.location.href = 'tickets.html';
//     });


// firebase.firestore().collection('tickets').add({
//     name: 'test',
//     email: 'test',
//     id: 'test',
// });

//add doc to stripe_customers collection under current userid

// console.log("No tickets and no payments");


// document.querySelector('#payments-list').innerHTML = `<p>You have not purchased any tickets yet.</p>`;
//show the payment panel
document.querySelector('#payment-panel').style.display = 'block';

//show showt1
document.getElementById("showt1").style.display = 'block';

//add event listener to save
document.querySelector('#save').addEventListener('click', () => {

    const email1 = document.getElementById("email1");

    const name1 = document.getElementById("name1");

    const id1 = document.getElementById("id1");

    //get data-state attribute of save button
    const state = document.querySelector('#save').getAttribute('data-state');
    if (state === 'active') {

        //add datafield to save button
        document.querySelector('#save').setAttribute('data-state', 'saved');

        //get all inputs in ticket-fields
        const inputs = document.querySelectorAll('#ticket-fields input');
        //for each input
        inputs.forEach(input => {
            //disable the input
            input.disabled = true;
        });
        //set innerHTML of save button to Edit
        document.querySelector('#save').value = "Edit Ticket Information";
        //make button green
        document.querySelector('#save').style.backgroundColor = "#4CAF50";

        //show payment-fulfillment
        document.querySelector('#payment-fulfillment').style.display = 'block';
        //set final-amount value to total-amount value
        console.log("Total Amount: " + document.querySelector('#total-amount').innerHTML);
        document.querySelector('#final-total').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML);


    } else if (state === 'saved') {
        //add datafield to save button
        document.querySelector('#save').setAttribute('data-state', 'active');

        //get all inputs in ticket-fields
        const inputs = document.querySelectorAll('#ticket-fields input');
        //for each input
        inputs.forEach(input => {
            //enable the input
            input.disabled = false;
        });
        //set innerHTML of save button to Save
        document.querySelector('#save').value = "Save Ticket Information";
        //make button blue
        document.querySelector('#save').style.backgroundColor = "#0070f3";
        //hide payment-fulfillment
        document.querySelector('#payment-fulfillment').style.display = 'none';

    }



});


//add event listener to the showt1 button
document.querySelector('#showt1').addEventListener('click', (e) => {
    //if ticket1 display is none set it to block
    if(document.querySelector('#ticket1').style.display === 'none'){
        console.log("Ticket 1 is hidden");
        //add 10 to totalamount value
        document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;

        document.querySelector('#ticket1').style.display = 'block';
        //set value of showt1 button to Remove Ticket1
        document.querySelector('#showt1').value = 'Remove Student Ticket ($10)';
        //make button red
        document.querySelector('#showt1').style.backgroundColor = 'red';
        //remove disabeled from showt2 button
        document.querySelector('#showt2').disabled = false;
        //enable save button
        document.querySelector('#save').disabled = false;

    }
    else{
        console.log("OTHER");

        //subtract 10 from totalamount value
        // document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;
        document.querySelector('#total-amount').innerHTML = 0;

        document.querySelector('#ticket1').style.display = 'none';
        //set value of showt1 button to Add Ticket1
        document.querySelector('#showt1').value = 'Add Student Ticket ($10)';
        //make button 0070F3
        document.querySelector('#showt1').style.backgroundColor = '#0070F3';
        //add disabeled to showt2 button
        document.querySelector('#showt2').disabled = false;
        //hide ticket2
        document.querySelector('#ticket2').style.display = 'none';

        document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
        //make button 0070F3
        document.querySelector('#showt2').style.backgroundColor = '#0070F3';

        //disable save button
        document.querySelector('#save').disabled = false;



    }
    //if checkout display is hidden set it to block
    if(document.querySelector('#charge').style.display === 'none'){
        document.querySelector('#charge').style.display = 'block';
    }

});

//add event listener to the showt2 button
document.querySelector('#showt2').addEventListener('click', (e) => {
    //if ticket2 display is none set it to block
    if(document.querySelector('#ticket2').style.display === 'none'){

        document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) + 10;

        document.querySelector('#ticket2').style.display = 'block';
        //set value of showt2 button to Remove Ticket2
        document.querySelector('#showt2').value = 'Remove Guest Ticket ($10)';
        //make button red
        document.querySelector('#showt2').style.backgroundColor = 'red';
    }
    else{
        //subtract 10 from totalamount value
        document.querySelector('#total-amount').innerHTML = parseInt(document.querySelector('#total-amount').innerHTML) - 10;

        document.querySelector('#ticket2').style.display = 'none';
        //set value of showt2 button to Add Ticket2
        document.querySelector('#showt2').value = 'Add Guest Ticket ($10)';
        //make button 0070F3
        document.querySelector('#showt2').style.backgroundColor = '#0070F3';
    }
    //if checkout display is hidden set it to block
    if(document.querySelector('#charge').style.display === 'none'){
        document.querySelector('#charge').style.display = 'block';
    }
});






// Add new card form
// document
//     .querySelector('#payment-method-form')
//     .addEventListener('submit', async (event) => {
//         event.preventDefault();
//         console.log('adding new card');
//         //if payemnt-form element named amount is 0 return
//         //
//
//
//
//         if (!event.target.reportValidity()) {
//             return;
//         }
//         document
//             .querySelectorAll('button')
//             .forEach((button) => (button.disabled = true));
//
//         const form = new FormData(event.target);
//         const cardholderName = form.get('name');
//
//         const { setupIntent, error } = await stripe.confirmCardSetup(
//             customerData.setup_secret,
//             {
//                 payment_method: {
//                     card: cardElement,
//                     billing_details: {
//                         name: cardholderName,
//                     },
//                 },
//             }
//         );
//
//         if (error) {
//             document.querySelector('#error-message').textContent = error.message;
//             document
//                 .querySelectorAll('button')
//                 .forEach((button) => (button.disabled = false));
//             return;
//         }
//
//         await firebase
//             .firestore()
//             .collection('stripe_customers')
//             .doc(currentUser.uid)
//             .collection('payment_methods')
//             .add({ id: setupIntent.payment_method })
//             .then(() => {
//                 console.log('payment method added');
//             });
//
//         document.querySelector('#add-new-card').open = false;
//         document
//             .querySelectorAll('button')
//             .forEach((button) => (button.disabled = false));
//
//         //reset form
//         document.getElementById('payment-method-form').reset();
//
//
//
//     });

// Create payment form
document
    .querySelector('#payment-form')
    .addEventListener('submit', async (event) => {
        event.preventDefault();



        if (document.getElementById('final-total').innerHTML === '0') {
                return;
            }

        document
            .querySelectorAll('button')
            .forEach((button) => (button.disabled = true));

        const form = new FormData(event.target);
        var amount = parseInt(document.getElementById('final-total').innerHTML);
        //multiple amount by 10
        // amount = amount * 10;
        // const currency = form.get('currency');
        // const amount = 10;
        const currency = 'usd';

        //get name1 and name2 from form
        const name1 = document.getElementById('name1').value;
        const name2 = document.getElementById('name2').value;
        //get email1 and email2 from form
        const email1 = document.getElementById('email1').value;
        const email2 = document.getElementById('email2').value;
        //get id1 and id2 from form
        const id1 = document.getElementById('id1').value;
        const id2 = document.getElementById('id2').value;

        //print name1 and name2 to console
        console.log(name1);
        console.log(name2);
        //print email1 and email2 to console
        console.log(email1);
        console.log(email2);
        //print id1 and id2 to console
        console.log(id1);
        console.log(id2);

        //get current timestamp
        const timestamp = Date.now();








        // const data = {
        //     payment_method: form.get('payment-method'),
        //     currency,
        //     amount: formatAmountForStripe(amount, currency),
        //     status: 'new',
        //     receipt_email: currentUser.email,
        //     metadata: {
        //         buyerName: name1,
        //         buyerEmail: email1,
        //         buyerId: id1,
        //         guestName: name2,
        //         guestEmail: email2,
        //         guestId: id2,
        //     },
        //
        // };

        // console.log(data);

        // await firebase
        //     .firestore()
        //     .collection('stripe_customers')
        //     .doc(currentUser.uid)
        //     .collection('payments')
        //     .add(data);

        // let ticketDocID = "CASH_" + currentUser.uid+ "_" + timestamp;
        //create ticket document
        //if name1 email1 and id1 are not empty
        if(name1 !== '' && email1 !== '' && id1 !== ''){
           let data = {
                name: name1,
                email: email1,
                id: id1,
               buyerEmail: email1,
           }
            firebase.functions().httpsCallable('createTicket')(data).then(function(result) {
                //when function is done
                console.log(result);

                document.getElementById('payment-form').reset();
                //reset ticket order
                document.getElementById('ticket-order').reset();
            });

        }
        //if name2 email2 and id2 are not empty
        if(name2 !== '' && email2 !== ''){
            //create ticket document
            let data = {
                name: name2,
                email: email2,
                id: id2,
                buyerEmail: email1,
            }
            //call createTicket cloud function
            firebase.functions().httpsCallable('createTicket')(data).then(function(result) {
                // Read result of the Cloud Function.
                console.log(result);
                //reset form
                document.getElementById('payment-form').reset();
                //reset ticket order
                document.getElementById('ticket-order').reset();
            });

        }

        document
            .querySelectorAll('button')
            .forEach((button) => (button.disabled = false));

        //reset form
        //reset payment-form
        document.getElementById('payment-form').reset();
        //refresh page
        //hide ticket1 and ticket2
        document.getElementById('ticket1').style.display = 'none';
        document.getElementById('ticket2').style.display = 'none';
        // setNameAndEmail();

        //refresh page
        // window.location.reload();

    });

/**
 * Helper functions
 */

// Format amount for diplay in the UI
function formatAmount(amount, currency) {
    amount = zeroDecimalCurrency(amount, currency)
        ? amount
        : (amount / 100).toFixed(2);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}

// Format amount for Stripe
function formatAmountForStripe(amount, currency) {
    return zeroDecimalCurrency(amount, currency)
        ? amount
        : Math.round(amount * 100);
}

// Check if we have a zero decimal currency
// https://stripe.com/docs/currencies#zero-decimal
function zeroDecimalCurrency(amount, currency) {
    let numberFormat = new Intl.NumberFormat(['en-US'], {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol',
    });
    const parts = numberFormat.formatToParts(amount);
    let zeroDecimalCurrency = true;
    for (let part of parts) {
        if (part.type === 'decimal') {
            zeroDecimalCurrency = false;
        }
    }
    return zeroDecimalCurrency;
}

// Handle card actions like 3D Secure
async function handleCardAction(payment, docId) {
    const { error, paymentIntent } = await stripe.handleCardAction(
        payment.client_secret
    );
    if (error) {
        alert(error.message);
        payment = error.payment_intent;
    } else if (paymentIntent) {
        payment = paymentIntent;
    }

    await firebase
        .firestore()
        .collection('stripe_customers')
        .doc(currentUser.uid)
        .collection('payments')
        .doc(docId)
        .set(payment, { merge: true });
}