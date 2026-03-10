# Fluency Coach
<img width="785" height="991" alt="image" src="https://github.com/user-attachments/assets/6a6ff1b2-1a03-4c57-b6b5-4bc938c2a967" />



Fluency Coach は、英語スピーキングの練習をサポートするWebアプリケーションです。

ブラウザ上で音声を録音・アップロードすると、AIが音声を文字起こしし、スピーキングに関するフィードバックを生成します。

---

## 概要

ユーザーがブラウザで録音した音声をアップロードすると、以下の処理を行います。

1. 音声のアップロード
2. OpenAI Whisperによる音声の文字起こし
3. GPTによるスピーキングフィードバック生成
4. 結果ページでフィードバックを表示

英語スピーキングの練習をサポートするAIアプリケーションとして開発しました。

---

## 主な機能

- ブラウザでの音声録音
- 音声ファイルのアップロード
- 音声の文字起こし（Whisper）
- AIによるスピーキングフィードバック生成（GPT）
- 結果ページでのフィードバック表示

---

## 技術スタック

### フロントエンド
- Next.js
- TypeScript
- React

### バックエンド
- FastAPI
- Python

### AI
- OpenAI Whisper（音声文字起こし）
- OpenAI GPT（フィードバック生成）

---

## アーキテクチャ


ブラウザ（Next.js）
↓
FastAPI Backend
↓
Whisper（音声文字起こし）
↓
GPT（フィードバック生成）
↓
結果ページ表示


---

## セットアップ方法

### 1. リポジトリをクローン


git clone https://github.com/yuukakageyama/fluency-coach

cd fluency-coach


---

### 2. バックエンドの起動


cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt


環境変数を設定


OPENAI_API_KEY=your_api_key


サーバー起動


python -m uvicorn main:app --reload --port 8000


---

### 3. フロントエンドの起動


cd frontend
npm install
npm run dev


---

## 今後の改善予定

- スピーキング評価の精度向上
- 発音分析機能の追加
- 音声波形の可視化
- デプロイ

---

## 作者

慶應義塾大学 理工学部 情報工学科  
蔭山侑花




