import mongoose from "mongoose";


function connect() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || typeof mongoUri !== 'string' || mongoUri.trim() === '') {
        console.error("MONGODB_URI is not set. Please define it in backend/.env");
        // Exit so we don't start the server in a bad state leading to buffering timeouts
        process.exit(1);
    }

    mongoose.connect(mongoUri)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch(err => {
            console.error("Failed to connect to MongoDB:", err.message);
            process.exit(1);
        })
}

export default connect;