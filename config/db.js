import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();
export const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',          // Your MySQL password, if any
    database: 'contacts_db' // Ensure this is the correct database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database!');
});

export default connection;
