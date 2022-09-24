let currentUser = {};
// let customerData = {};

//center tickets div in body
//get width of screen in rem
// let width = document.body.clientWidth / 16;
// let margin = (width-18)/2;
// document.getElementById("tickets").style.marginLeft = margin + "rem";

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

// console.log("running");



firebase.auth().onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
        currentUser = firebaseUser;
        console.log("User is logged in");
        //print currenr user id
        console.log(currentUser.uid);


        //get all tickets from firebase where buyerEmail = currentUser.email
        const db = firebase.firestore();
        db.collection("tickets")
            .where("buyerEmail", "==", currentUser.email)
            .orderBy("id", "desc")
            .get()
            .then((querySnapshot) => {
                if(querySnapshot.empty) {
                    //set innerHTML of tickets div to "No tickets found"
                    document.getElementById("message").innerHTML = "<h5>No tickets found. Buy tickets <a href='store.html'>here</a></h5>";
                }

            querySnapshot.forEach((doc) => {
                if(doc.exists) {
                    console.log(doc.data());
                    //get name email id and qr code from the doc
                    const name = doc.data().name;
                    const email = doc.data().email;
                    const id = doc.data().id;
                    const qrCode = doc.data().qrcode;

                    //ticket type
                    let ticketType = "";
                    if(doc.data().email == currentUser.email) {
                        ticketType = "Ticket";
                    }
                    else {
                        ticketType = "Guest Ticket";
                    }

                    //create a new card in the div tickets with the data from the doc
                    const card = document.createElement('div');
                    card.className = 'ticket';
                    card.innerHTML = `
                    <div class="card ticket-header" >
                        
                        <img class="card-img-top" src="${qrCode}" alt="qr code">
                    
                        <div class="card-body ticket-body">
                            <h2>${ticketType}</h2>
                            <h3>${name}</h3>
                            <p>${email}</p>
                            <p>${id}</p>
                        </div>
                    </div>
                    <br>
                `;
                    document.getElementById('tickets').appendChild(card);
                }
            });
        });


/**
        firebase
            .firestore()
            .collection('stripe_customers')
            .doc(currentUser.uid)
            .collection('payments')
            .orderBy('created', 'desc')
            .onSnapshot((snapshot) => {
                snapshot.forEach((doc) => {

                    //if doc has error skip it
                    if (doc.data().error) {
                        console.log("error");
                        return;
                    }

                    //get the payment id from the doc
                    const paymentId = doc.data().id;


                    //search ticket collection for docs with an id that contains the payment id

                    firebase.firestore().collection('tickets').doc(paymentId).get().then((doc) => {

                        //print data
                        if(doc.exists) {
                            console.log(doc.data());
                            //get name email id and qr code from the doc
                            const name = doc.data().name;
                            const email = doc.data().email;
                            const id = doc.data().id;
                            const qrCode = doc.data().qrcode;

                            //create a new card in the div tickets with the data from the doc
                            const card = document.createElement('div');
                            card.className = 'ticket';
                            card.innerHTML = `
                    <div class="card ticket-header" style="width: 18rem;">
                        
                        <img class="card-img-top" src="${qrCode}" alt="qr code">
                    
                        <div class="card-body ticket-body">
                            <h2>Ticket</h2>
                            <h3>${name}</h3>
                            <p>${email}</p>
                            <p>${id}</p>
                        </div>
                    </div>
                `;
                            document.getElementById('tickets').appendChild(card);
                        }

                    });
                    //search ticket collection for the paymentId with doc id+guest
                    firebase.firestore().collection('tickets').doc(paymentId + 'guest').get().then((doc) => {

                        if(doc.exists) {
                            console.log(doc.data());
                            //get name email id and qr code from the doc
                            const name = doc.data().name;
                            const email = doc.data().email;
                            const id = doc.data().id;
                            const qrCode = doc.data().qrcode;

                            //create a new card in the div tickets with the data from the doc
                            const card = document.createElement('div');
                            card.className = 'ticket';


                            card.innerHTML = `
                    <div class="card ticket-header" style="width: 18rem;">
                        
                        <img class="card-img-top" src="${qrCode}" alt="qr code">
                    
                        <div class="card-body ticket-body">
                            <h2>Guest Ticket</h2>
                            <h3>${name}</h3>
                            <p>${email}</p>
                            <p>${id}</p>
                        </div>
                    </div>
                `;
                            document.getElementById('tickets').appendChild(card);
                        }

                    });







                });



            });

*/




    } else {
        window.location.href = 'login.html?redirect=tickets';

    }
});




