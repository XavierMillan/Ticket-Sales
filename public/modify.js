
    const fireconfig = {
    apiKey: "AIzaSyBQbyfhDHOqNNKTVGjYuGJs3lBykdp9SKM",
    authDomain: "stripe-bb257.firebaseapp.com",
    projectId: "stripe-bb257",
    storageBucket: "stripe-bb257.appspot.com",
    messagingSenderId: "806611367820",
    appId: "1:806611367820:web:e554f48f3a6c9c655b08a9",
    measurementId: "G-WXK2DY6LRL"
};



    //if firebase is not initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(fireconfig);
    }



    //if users display name is not set


    // firebase.initializeApp(config);


    //if user is logged in
    firebase.auth().onAuthStateChanged(function(user) {

        //get user custom claim of ticket control
        let ticketControl = false;
        let scannerHTML = "";
        let scannerHTMLmobile = "";
       user.getIdTokenResult().then(idTokenResult => {
            ticketControl = idTokenResult.claims.ticketcontrol;
            console.log(ticketControl);
            if(ticketControl) {
                scannerHTML = `<li><a href="scanner.html"><span class="color">Scanner</span></a></li>`;
                scannerHTMLmobile = `<li><a href="scanner.html"><span>Scanner</span></a></li>`;
            }
            else {
                scannerHTML = "";
            }



       //get name of current html page
         let pageName = window.location.pathname.split("/").pop();
         let homeActive = "";
         let aboutActive  = "";
            let ticketsActive  = "";
            let scannerActive  = "";
            let storeActive  = "";
            let accountActive  = "";

            if(pageName == "index.html") {
                homeActive = "class= 'active'";
            }
            else if(pageName == "about.html") {
                aboutActive = "class= 'active'";
            }
            else if(pageName == "tickets.html") {
                ticketsActive = "class= 'active'";
            }
            else if(pageName == "scanner.html") {
                scannerActive = "class= 'active'";
            }
            else if(pageName == "store.html") {
                storeActive = "class= 'active'";
            }
            else if(pageName == "support.html") {
                accountActive = "active";
            }


    if (user) {
    // User is signed in.


    console.log("User is signed in");

    let name = user.displayName;

    document.getElementById("navbar").innerHTML =
    `
              <div class="container">
        <div class="row align-items-center">

          <div class="col-11 col-xl-2">
                <h1 class="mb-0 site-logo"><a href="index.html" class="color">Brand</a></h1>
            </div>
          <div class="col-12 col-md-10 d-none d-xl-block">
            <nav class="site-navigation position-relative text-right" role="navigation">

              <ul class="site-menu js-clone-nav mr-auto d-none d-lg-block">
                <li ${homeActive}><a href="index.html"><span class="color">Home</span></a></li>
                <li ${aboutActive}><a href="about.html"><span class="color">About</span></a></li>
                <li ${storeActive}><a href="store.html"><span class="color">Store</span></a></li>
                <li ${ticketsActive}><a href="tickets.html"><span class="color">Tickets</span></a></li>
                ${scannerHTML}

                <li class="has-children ${accountActive}" id="account">
                  <span class="color" >Hi, ${name}!</span>
                    <ul class="dropdown arrow-top">
                        <li class="${accountActive}"><a href="support.html">Support</a></li>
                      <li>
                        <a href="logout.html">Log Out</a>
                      </li>
                    </ul>
                </li>

              </ul>
            </nav>
          </div>


          <div class="d-inline-block d-xl-none ml-md-0 mr-auto py-3" style="position: relative; top: 3px;"><a href="#" class="site-menu-toggle js-menu-toggle color"><span class="icon-menu h3"></span></a></div>

          </div>

        </div>
      </div>


              `;

    let mobilehtml = `

              <ul class="site-nav-wrap">
                <li ${homeActive}><a href="index.html"><span>Home</span></a></li>
                <li ${aboutActive} ><a href="about.html"><span>About</span></a></li>
                <li ${storeActive} ><a href="store.html"><span>Store</span></a></li>
                <li ${ticketsActive}><a href="tickets.html"><span>Tickets</span></a></li>
                ${scannerHTMLmobile}
                <li class="${accountActive}" ><a href="support.html"><span>Support</span></a></li>
                <li><a href="logout.html"><span>Log Out</span></a></li>




              </ul>

              `;

    //set mobile-nav innerHTML to mobilehtml
    document.getElementById("mobile-nav").innerHTML = mobilehtml;



} else {
    // No user is signed in.
    console.log("User is not signed in");
}
}
    );

    });
