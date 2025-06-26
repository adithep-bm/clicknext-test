require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token is not valid" });
        req.user = user;
        next();
    });
};

const UserLoginSchema = z.object({
    email: z.string().min(1),
    password: z.string().min(1),
});

const TransactionSchema = z.object({
    type: z.enum(['deposit', 'withdraw']),
    amount: z.number().positive().max(100000),
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = UserLoginSchema.parse(req.body);
        const sql = "SELECT * FROM users WHERE email = ?";
        db.get(sql, [email], async (err, user) => {
            if (err || !user) return res.status(400).json({ "error": "Invalid email or password" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ message: "Login successful", token, userId: user.id });
            } else {
                res.status(400).json({ "error": "Invalid email or password" });
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.errors });
    }
});

app.get('/api/user/data', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const userSql = "SELECT id, username, email FROM users WHERE id = ?";
    const transactionsSql = "SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC";

    Promise.all([
        new Promise((resolve, reject) => {
            db.get(userSql, [userId], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(transactionsSql, [userId], (err, transactions) => {
                if (err) reject(err);
                else resolve(transactions);
            });
        })
    ]).then(([user, transactions]) => {
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const balance = transactions.reduce((acc, tx) => {
            return tx.type === 'deposit' ? acc + tx.amount : acc - tx.amount;
        }, 0);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            balance,
            transactions
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    try {
        const { type, amount } = TransactionSchema.parse(req.body);
        const userId = req.user.id;
        const sql = 'INSERT INTO transactions (userId, type, amount) VALUES (?,?,?)';
        db.run(sql, [userId, type, amount], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Transaction successful", id: this.lastID });
        });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

const UpdateAmountSchema = z.object({
    amount: z.number().positive().max(100000),
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user.id;

        const parsedBody = UpdateAmountSchema.parse(req.body);
        const newAmount = parsedBody.amount; 

        const sql = 'UPDATE transactions SET amount = ? WHERE id = ? AND userId = ?';

        db.run(sql, [newAmount, transactionId, userId], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Transaction not found or you do not have permission to edit it." });
            }

            res.status(200).json({ message: "Transaction updated successfully" });
        });
    } catch (error) {

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    const transactionId = req.params.id;
    const userId = req.user.id;

    const sql = 'DELETE FROM transactions WHERE id = ? AND userId = ?';
    db.run(sql, [transactionId, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: "Transaction not found or you do not have permission to delete it." });
        }
        res.status(200).json({ message: "Transaction deleted successfully" });
    });
});


const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    db.get("SELECT * FROM users WHERE username = 'test'", [], async (err, row) => {
        if (!row) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("1234", salt);
            db.run("INSERT INTO users (username, email, password) VALUES (?,?,?)",
                ['test', 'test@example.com', hashedPassword],
                () => console.log("Test user created with hashed password.")
            );
        }
    });
});