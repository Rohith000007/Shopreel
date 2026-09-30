from flask import Flask, jsonify, render_template, request
import sqlite3
from pathlib import Path
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "shopreel.db"

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False


PRODUCTS = [
    {
        "name": "AeroRun Street Sneakers",
        "price": 3499,
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
        "category": "Footwear",
        "description": "Lightweight everyday sneakers with a cushioned sole, breathable upper and clean streetwear silhouette."
    },
    {
        "name": "Pulse Pro Wireless Headphones",
        "price": 5999,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
        "category": "Audio",
        "description": "Over-ear wireless headphones designed for immersive listening, commuting and focused study sessions."
    },
    {
        "name": "Orbit Minimal Watch",
        "price": 2799,
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
        "category": "Wearables",
        "description": "Minimal analog watch with a refined dial that works equally well with casual and formal outfits."
    },
    {
        "name": "Metro Sling Crossbody",
        "price": 1899,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
        "category": "Accessories",
        "description": "Compact crossbody bag with organized storage for a phone, wallet, keys and daily essentials."
    },
    {
        "name": "Cloudline Oversized Tee",
        "price": 1299,
        "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
        "category": "Apparel",
        "description": "Soft heavyweight cotton tee with an oversized fit and versatile neutral styling."
    },
    {
        "name": "SnapCharge 3-in-1 Dock",
        "price": 3299,
        "image": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=85",
        "category": "Tech",
        "description": "Compact charging station concept for keeping your everyday devices powered and organized."
    },
    {
        "name": "Echo Mini Bluetooth Speaker",
        "price": 2499,
        "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
        "category": "Audio",
        "description": "Portable wireless speaker with a bold sound profile and a carry-anywhere form factor."
    },
    {
        "name": "Core Utility Backpack",
        "price": 2299,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
        "category": "Accessories",
        "description": "Daily backpack with practical compartments for a laptop, charger, notebook and accessories."
    },
]

VIDEO_URLS = [
    "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    "https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4",
    "https://storage.googleapis.com/coverr-main/mp4/Skateboard.mp4",
    "https://storage.googleapis.com/coverr-main/mp4/For_Wes.mp4",
]

REELS = [
    {
        "creator": "@maya.moves",
        "caption": "These sneakers have become my everyday pair. Super comfortable for campus days and evening walks.",
        "video_url": VIDEO_URLS[0],
        "product_id": 1,
        "likes_count": 128,
        "is_certified_buyer": 1,
        "order_verification_id": "ORD-VERIFIED-9831",
        "buyer_rating": 4.8,
    },
    {
        "creator": "@arjun.audio",
        "caption": "Tried these headphones for a full study session. The fit stayed comfortable and the sound is seriously immersive.",
        "video_url": VIDEO_URLS[1],
        "product_id": 2,
        "likes_count": 94,
        "is_certified_buyer": 1,
        "order_verification_id": "ORD-VERIFIED-4172",
        "buyer_rating": 4.7,
    },
    {
        "creator": "@nisha.daily",
        "caption": "A tiny crossbody makes a huge difference when I only need the essentials for a coffee run.",
        "video_url": VIDEO_URLS[2],
        "product_id": 4,
        "likes_count": 76,
        "is_certified_buyer": 0,
        "order_verification_id": "",
        "buyer_rating": 5.0,
    },
    {
        "creator": "@rohan.tech",
        "caption": "My desk setup feels way cleaner after moving charging cables into one compact dock.",
        "video_url": VIDEO_URLS[3],
        "product_id": 6,
        "likes_count": 143,
        "is_certified_buyer": 1,
        "order_verification_id": "ORD-VERIFIED-6284",
        "buyer_rating": 4.9,
    },
    {
        "creator": "@tara.style",
        "caption": "The oversized tee is easy to dress up or down, and the fabric feels much nicer than I expected.",
        "video_url": VIDEO_URLS[4],
        "product_id": 5,
        "likes_count": 61,
        "is_certified_buyer": 1,
        "order_verification_id": "ORD-VERIFIED-7350",
        "buyer_rating": 4.6,
    },
]

COMMENTS = [
    (1, "dev_07", "Does the sole feel comfortable after a long day?"),
    (1, "riya.codes", "The colorway is so clean 🔥"),
    (2, "akshay.mp", "How is the mic quality for calls?"),
    (2, "meera", "That desk setup looks amazing."),
    (3, "kiran", "This is exactly the size I was looking for."),
    (4, "techwithsam", "Does it support fast charging?"),
    (5, "ananya", "Love the relaxed fit!"),
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS reels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creator TEXT NOT NULL,
            caption TEXT NOT NULL,
            video_url TEXT NOT NULL,
            product_id INTEGER,
            likes_count INTEGER DEFAULT 0,
            is_certified_buyer INTEGER DEFAULT 0,
            order_verification_id TEXT,
            buyer_rating REAL DEFAULT 5.0,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER UNIQUE,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reel_id INTEGER UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reel_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            comment_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE
        );
        """
    )

    if conn.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        conn.executemany(
            """
            INSERT INTO products (name, price, image, category, description)
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    p["name"], p["price"], p["image"], p["category"], p["description"]
                )
                for p in PRODUCTS
            ],
        )

    if conn.execute("SELECT COUNT(*) FROM reels").fetchone()[0] == 0:
        conn.executemany(
            """
            INSERT INTO reels
            (creator, caption, video_url, product_id, likes_count,
             is_certified_buyer, order_verification_id, buyer_rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    r["creator"], r["caption"], r["video_url"], r["product_id"],
                    r["likes_count"], r["is_certified_buyer"],
                    r["order_verification_id"], r["buyer_rating"]
                )
                for r in REELS
            ],
        )

    if conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0] == 0:
        conn.executemany(
            """
            INSERT INTO comments (reel_id, username, comment_text)
            VALUES (?, ?, ?)
            """,
            COMMENTS,
        )

    conn.commit()
    conn.close()


def row_to_dict(row):
    return dict(row) if row else None


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/products")
def products():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()

    conn = get_db()
    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if search:
        query += " AND (name LIKE ? OR category LIKE ? OR description LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if category and category.lower() != "all":
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY id ASC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.get("/api/products/<int:product_id>")
def product_detail(product_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(dict(row))


@app.get("/api/reels")
def reels():
    conn = get_db()
    rows = conn.execute(
        """
        SELECT
            r.*,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            p.category AS product_category,
            p.description AS product_description,
            CASE WHEN l.id IS NULL THEN 0 ELSE 1 END AS liked_by_user,
            (
                SELECT COUNT(*)
                FROM comments c
                WHERE c.reel_id = r.id
            ) AS comment_count
        FROM reels r
        LEFT JOIN products p ON p.id = r.product_id
        LEFT JOIN likes l ON l.reel_id = r.id
        ORDER BY r.id ASC
        """
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.post("/api/reels/<int:reel_id>/like")
def toggle_like(reel_id):
    conn = get_db()
    reel = conn.execute(
        "SELECT id, likes_count FROM reels WHERE id = ?", (reel_id,)
    ).fetchone()

    if not reel:
        conn.close()
        return jsonify({"error": "Reel not found"}), 404

    existing = conn.execute(
        "SELECT id FROM likes WHERE reel_id = ?", (reel_id,)
    ).fetchone()

    if existing:
        conn.execute("DELETE FROM likes WHERE reel_id = ?", (reel_id,))
        new_count = max(0, int(reel["likes_count"]) - 1)
        conn.execute(
            "UPDATE reels SET likes_count = ? WHERE id = ?",
            (new_count, reel_id),
        )
        liked = False
    else:
        conn.execute("INSERT INTO likes (reel_id) VALUES (?)", (reel_id,))
        new_count = int(reel["likes_count"]) + 1
        conn.execute(
            "UPDATE reels SET likes_count = ? WHERE id = ?",
            (new_count, reel_id),
        )
        liked = True

    conn.commit()
    conn.close()
    return jsonify({"liked": liked, "likes_count": new_count})


@app.get("/api/reels/<int:reel_id>/comments")
def get_comments(reel_id):
    conn = get_db()
    reel = conn.execute(
        "SELECT id FROM reels WHERE id = ?", (reel_id,)
    ).fetchone()
    if not reel:
        conn.close()
        return jsonify({"error": "Reel not found"}), 404

    rows = conn.execute(
        """
        SELECT id, reel_id, username, comment_text, created_at
        FROM comments
        WHERE reel_id = ?
        ORDER BY id ASC
        """,
        (reel_id,),
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.post("/api/reels/<int:reel_id>/comments")
def add_comment(reel_id):
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "guest")).strip()[:40]
    comment_text = str(data.get("comment_text", "")).strip()[:500]

    if not comment_text:
        return jsonify({"error": "Comment cannot be empty"}), 400

    conn = get_db()
    reel = conn.execute(
        "SELECT id FROM reels WHERE id = ?", (reel_id,)
    ).fetchone()

    if not reel:
        conn.close()
        return jsonify({"error": "Reel not found"}), 404

    cursor = conn.execute(
        """
        INSERT INTO comments (reel_id, username, comment_text)
        VALUES (?, ?, ?)
        """,
        (reel_id, username or "guest", comment_text),
    )
    row = conn.execute(
        "SELECT id, reel_id, username, comment_text, created_at FROM comments WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    conn.commit()
    conn.close()
    return jsonify(dict(row)), 201


def cart_payload(conn):
    rows = conn.execute(
        """
        SELECT
            c.product_id,
            c.quantity,
            p.name,
            p.price,
            p.image,
            p.category
        FROM cart c
        JOIN products p ON p.id = c.product_id
        ORDER BY c.id ASC
        """
    ).fetchall()

    items = [dict(row) for row in rows]
    count = sum(item["quantity"] for item in items)
    total = sum(item["quantity"] * item["price"] for item in items)

    return {
        "items": items,
        "count": count,
        "total": round(total, 2),
    }


@app.get("/api/cart")
def get_cart():
    conn = get_db()
    payload = cart_payload(conn)
    conn.close()
    return jsonify(payload)


@app.post("/api/cart/add")
def add_to_cart():
    data = request.get_json(silent=True) or {}

    try:
        product_id = int(data.get("product_id"))
        quantity = int(data.get("quantity", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "product_id and quantity must be integers"}), 400

    if quantity <= 0:
        return jsonify({"error": "Quantity must be greater than zero"}), 400

    conn = get_db()
    product = conn.execute(
        "SELECT id FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    existing = conn.execute(
        "SELECT quantity FROM cart WHERE product_id = ?", (product_id,)
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE cart SET quantity = ? WHERE product_id = ?",
            (existing["quantity"] + quantity, product_id),
        )
    else:
        conn.execute(
            "INSERT INTO cart (product_id, quantity) VALUES (?, ?)",
            (product_id, quantity),
        )

    conn.commit()
    payload = cart_payload(conn)
    conn.close()
    return jsonify(payload), 201


@app.post("/api/cart/update")
def update_cart():
    data = request.get_json(silent=True) or {}

    try:
        product_id = int(data.get("product_id"))
        delta = int(data.get("delta"))
    except (TypeError, ValueError):
        return jsonify({"error": "product_id and delta must be integers"}), 400

    if delta == 0:
        return jsonify({"error": "Delta cannot be zero"}), 400

    conn = get_db()
    existing = conn.execute(
        "SELECT quantity FROM cart WHERE product_id = ?", (product_id,)
    ).fetchone()

    if not existing:
        conn.close()
        return jsonify({"error": "Cart item not found"}), 404

    new_quantity = existing["quantity"] + delta
    if new_quantity <= 0:
        conn.execute("DELETE FROM cart WHERE product_id = ?", (product_id,))
    else:
        conn.execute(
            "UPDATE cart SET quantity = ? WHERE product_id = ?",
            (new_quantity, product_id),
        )

    conn.commit()
    payload = cart_payload(conn)
    conn.close()
    return jsonify(payload)


@app.post("/api/cart/remove")
def remove_from_cart():
    data = request.get_json(silent=True) or {}

    try:
        product_id = int(data.get("product_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "product_id must be an integer"}), 400

    conn = get_db()
    conn.execute("DELETE FROM cart WHERE product_id = ?", (product_id,))
    conn.commit()
    payload = cart_payload(conn)
    conn.close()
    return jsonify(payload)


@app.post("/api/cart/checkout")
def checkout():
    conn = get_db()
    payload = cart_payload(conn)

    if not payload["items"]:
        conn.close()
        return jsonify({"error": "Your cart is empty"}), 400

    transaction_id = f"SR-{uuid4().hex[:10].upper()}"
    conn.execute("DELETE FROM cart")
    conn.commit()
    conn.close()

    return jsonify(
        {
            "success": True,
            "transaction_id": transaction_id,
            "amount": payload["total"],
            "items": payload["count"],
        }
    )


@app.errorhandler(404)
def not_found(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint not found"}), 404
    return error


@app.errorhandler(500)
def server_error(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Internal server error"}), 500
    return error


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
