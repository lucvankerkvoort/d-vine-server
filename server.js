const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
// const { uuid } = require("uuidv4");
const app = express();

// setup request logging
app.use(morgan("dev"));
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve client from build folder
app.use(express.static(path.join(__dirname, "build")));

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.

// enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
    path: "./.env",
});

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const Stripe = require("stripe");
const stripe = Stripe(process.env.REACT_APP_STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
    const line_items = req.body;
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["ideal"],

        // or you can take multiple payment methods with
        // payment_method_types: ['card', 'ideal', ...]
        line_items,
        mode: "payment",
        success_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel",
    });

    res.json({ id: session.id });
});
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "build", "index.html"));
// });


const calculateOrderAmount = (items, discount) => {
    let total = 0;
    items.map(item => {
        total += (item.price * item.quantity);
    })
    total = total - ((discount / 100) * total)
    return total;
};

app.post('/secret', async (req, res) => {
    try {
        const { items, discount } = req.body;
        console.log(discount);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items, discount) * 100,
            currency: 'eur',
            payment_method_types: ['ideal'],
        });

        res.json({ client_secret: paymentIntent.client_secret });
    }
    catch {
        console.log("error");
    }
});


app.listen(process.env.PORT || 4242, () => console.log(`Listening on port ${process.env.PORT || 4242}!`));
