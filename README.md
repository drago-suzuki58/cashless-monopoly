# Cashless Monopoly

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-success.svg)](#)

*Read this document in other languages: [日本語 (Japanese)](README.ja.md)*

A fully offline, serverless Progressive Web App (PWA) designed to replace physical paper money in analog board games (like Monopoly) with high-speed digital transactions.

**Note:** *This project was generated and developed entirely by an AI assistant via [OpenCode](https://github.com/github-copilot).*

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
