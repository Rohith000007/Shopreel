# ShopReel

ShopReel is a full-stack social-commerce demo that combines a vertical short-video feed with an integrated product catalog, cart, checkout simulation, comments and purchase-verification badges.

## Stack

- **Backend:** Python 3 + Flask
- **Database:** SQLite using Python's built-in `sqlite3`
- **Frontend:** HTML5, Vanilla JavaScript ES6+, modern CSS3
- **Icons:** Phosphor Icons web package via CDN
- **Typography:** Plus Jakarta Sans via Google Fonts
- **Media:** Unsplash product imagery and public MP4 demo media

## Project structure

```text
ShopReel/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    ├── app.js
    └── videos/
```

`shopreel.db` is generated automatically beside `app.py` on first launch.

## Requirements

- Python 3.10+ recommended
- Internet connection for the external Google Fonts, Phosphor Icons, Unsplash images and public demo MP4 files

No Node.js, npm, build system or external database server is required.

## Setup

### 1. Open the project

```bash
cd ShopReel
```

### 2. Create a virtual environment

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

The requested one-command launch is:

```bash
python app.py
```

Flask starts on:

```text
http://127.0.0.1:5000
```

The app also binds to `0.0.0.0:5000`, so it can be reached from another device on the same network using the host machine's LAN IP.

## Database behavior

On startup, `app.py`:

1. Creates `shopreel.db` if it does not exist.
2. Enables SQLite foreign keys.
3. Uses `sqlite3.Row` for named-column access.
4. Creates the five requested tables if they do not already exist.
5. Seeds 8 products, 5 reels and sample comments when their respective tables are empty.
6. Preserves existing data on subsequent launches.

To reset the demo completely, stop Flask and delete:

```text
shopreel.db
```

Then run:

```bash
python app.py
```

The database will be recreated and reseeded.

## REST API

### Products

```text
GET  /api/products
GET  /api/products/<id>
```

Optional catalog filters:

```text
GET /api/products?search=headphones
GET /api/products?category=Audio
GET /api/products?search=tech&category=Tech
```

### Reels

```text
GET  /api/reels
POST /api/reels/<id>/like
GET  /api/reels/<id>/comments
POST /api/reels/<id>/comments
```

Comment request body:

```json
{
  "username": "guest_user",
  "comment_text": "This looks useful!"
}
```

### Cart

```text
GET  /api/cart
POST /api/cart/add
POST /api/cart/update
POST /api/cart/remove
POST /api/cart/checkout
```

Add request:

```json
{
  "product_id": 1,
  "quantity": 1
}
```

Update request:

```json
{
  "product_id": 1,
  "delta": 1
}
```

Remove request:

```json
{
  "product_id": 1
}
```

Checkout returns a simulated transaction ID and clears the cart. It does not connect to a payment provider and does not charge money.

## Frontend features

### Home

- Responsive hero section
- Gradient typography
- Reels and Shop calls to action
- Trending product cards

### Reels

- Full-height vertical scroll
- CSS `scroll-snap-type: y mandatory`
- IntersectionObserver autoplay
- Off-screen video pause
- Global mute/unmute state
- Real like toggle backed by SQLite
- Double-tap like animation
- Comments drawer
- Web Share API with clipboard fallback
- Certified Buyer Review badge
- Verification modal with order verification ID and buyer rating
- Shoppable product overlay

### Shop

- Debounced client-side search
- Category pills
- Responsive product grid
- Product quickview modal
- Add-to-cart actions

### Cart

- Quantity increment/decrement
- Remove items
- Subtotal
- Free shipping above ₹999; otherwise ₹79
- `SHOPREEL10` coupon for 10% off the product subtotal
- Demo checkout
- Generated transaction ID
- Success modal

### Profile

- Saved Reels statistic
- Verified Reviews statistic
- Total Spent statistic
- Demo profile and action links

## Important demo notes

ShopReel is intentionally a local demonstration rather than a real marketplace. The "Certified Buyer" state is seeded database data; the displayed order verification IDs are fictional demo identifiers. Checkout is simulated and no payment or real order is created.

The project does not require the MP4 files to be stored locally. The `static/videos/` directory is included to match the requested project layout and can be used for self-hosted video assets later.

## Production hardening checklist

Before deploying a real commerce service, add authentication/session management, CSRF protection where appropriate, server-side authorization, persistent user identities, real payment-provider integration, order/invoice storage, cryptographic verification of purchase records, image/video upload validation, content moderation, rate limiting, HTTPS, structured logging, secret management, database migrations, backups, observability and a production WSGI server.

For a local demonstration, `python app.py` is sufficient.
