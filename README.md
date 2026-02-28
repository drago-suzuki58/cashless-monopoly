# Cashless Monopoly

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-success.svg)](#)

*Read this document in other languages: [日本語 (Japanese)](README.ja.md)*

A fully offline, serverless Progressive Web App (PWA) designed to replace physical paper money in analog board games (like Monopoly) with high-speed digital transactions.

**Note:** *This project was generated and developed entirely by an AI assistant via [OpenCode](https://opencode.ai).*

---

## 🎮 How to Play / User Guide

Here is the basic flow for using the app during a game session.

### 1. Preparation (Assigning Roles)

Before starting the game, decide which devices will play which role.

1. **Set up the Bank:** Place one tablet or smartphone in the center of the table and select "Bank" from the app's home screen.
2. **Set up Players:** Every player opens the app on their own smartphone and selects "Player".

### 2. Joining the Game (Registration)

1. On their smartphones, players input their **Name, Theme Color, and Initial Balance** (usually 1500), then tap "Show Registration QR".
2. Present the generated QR code to the "Bank" device's camera.
3. Once the player's name appears on the Bank's screen, tap "Done" on the player's device to enter the main game screen.

### 3. Transactions During the Game

All money transfers are completed by players generating a QR code and having the Bank scan it.

*   **Paying / Receiving from the Bank:**
    Players enter an amount on their device's keypad and tap "Pay" or "Receive". Present the generated QR code to the Bank's camera.
*   **Transferring Money Between Players:**
    Since there is no direct (P2P) communication, this requires two steps:
    1. The 【Payer】 generates a "Pay [Amount]" QR and the Bank scans it.
    2. The 【Receiver】 generates a "Receive [Amount]" QR and the Bank scans it.

### 4. Correcting Mistakes (Undo)

If a wrong amount is scanned, it can be easily reverted.

1. Tap the "History" (clock icon) button in the top right corner of the player's screen who made the mistake.
2. Find the incorrect transaction and tap the "Undo" button to display an Undo QR code.
3. Have the Bank scan this QR code. The transaction will be rolled back, and the balance will be restored.

### 5. Recovering Lost Data (Crash Recovery)

If a player accidentally closes their browser tab or reloads the page, their local data might be reset. If they simply register again as a new user, the "transaction sequence number (seq)" remembered by the Bank will be out of sync, causing future transactions to fail. 

**In such cases, you must perform a "Recovery":**

1. 【Bank】 On the Bank screen, tap the name panel of the disconnected player.
2. 【Bank】 A "Recovery QR" for that player will be displayed.
3. 【Player】 On the player's registration screen, tap the "Restore from Bank" button to activate the camera.
4. 【Player】 Scan the Recovery QR displayed on the Bank screen. Your balance and transaction sequence (seq) will be fully synchronized, allowing you to return to the game seamlessly.

---

## 🌟 Overview & The "Offline-First" Architecture

The biggest challenge with existing digital board game banking apps is that they require a shared Wi-Fi network, Bluetooth pairing, or creating accounts on a central web server. 

**Cashless Monopoly requires absolutely zero network connection after the initial page load.** 

All communication between devices is optical (one-way). It works entirely by generating and scanning highly-optimized JSON payloads embedded within QR codes.

### Roles

*   🏦 **Bank (Source of Truth)**
    *   Usually runs on a tablet or a dedicated central phone.
    *   Acts as the scanner. Reads QR codes presented by players.
    *   Maintains the canonical state: player balances, transaction histories, and duplicate-scan prevention algorithms.
*   📱 **Player (Remote Control)**
    *   Runs on each individual player's smartphone.
    *   Acts as a QR code generator. Players input amounts on a keypad to generate a payload for paying, receiving, undoing, or registering.
    *   Calculates a local estimation of their current balance for convenience.

## 🚀 Core Features & Fail-safes

*   **Idempotent Transactions (Double-Scan Prevention):**
    Every transaction QR includes the player's unique `uuid` and an incrementing sequence number (`seq`). If the Bank's camera accidentally scans the same QR code twice, it detects the duplicate `uuid-seq` combination and safely ignores it.
*   **Robust Undo System:**
    If a player makes a mistake, they can select a specific past transaction from their local history and generate an "Undo QR". The Bank scans this to mathematically revert the exact transaction amount based on its target `seq`.
*   **Crash Recovery (Sync):**
    If a player accidentally closes their browser tab and loses their state, the Bank can generate a "Recovery QR" containing their absolute current balance and next expected sequence number.
    *(Optimization Note: To keep QR density low and scannable on older devices, the Sync payload strips out the transaction history array and only transfers absolute state).*
*   **Dynamic Camera Selection:**
    The Bank interface automatically populates a dropdown of all available camera lenses on the device, allowing users to switch to macro or specific rear lenses for better QR focus.
*   **PWA Ready:**
    Installable to the home screen for a seamless, full-screen native app experience without browser UI clutter.

## 📦 Data Payload Specification

QR codes are kept incredibly small to ensure instant scanning. A typical transaction payload looks like this:

```json
{
  "uuid": "player-id-string",
  "act": "tx",
  "amt": -150,
  "seq": 4
}
```
*   `act`: Transaction type (`reg` for register, `tx` for pay/receive, `undo`, `sync`).
*   `amt`: Amount (Negative = Pay Bank, Positive = Receive from Bank).

## 🛠 Tech Stack

*   **UI:** React 19, React Router v7
*   **Styling:** Tailwind CSS v4 (configured for strict mobile bounds without flex-stretching on keypads)
*   **State Management:** Zustand (with localStorage persistence)
*   **QR Scanning:** `html5-qrcode`
*   **QR Generation:** `qrcode.react`
*   **Build Tool:** Vite (with `vite-plugin-pwa`)

## 💻 Development & Setup

Make sure you have Node.js installed.

1.  **Clone and install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npm run dev
    ```
    *(Scan the local network IP provided by Vite with your phone to test the Player interface while running the Bank on your desktop)*
3.  **Build for production:**
    ```bash
    npm run build
    ```
