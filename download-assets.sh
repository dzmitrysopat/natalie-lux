#!/usr/bin/env bash
# Скачивает картинки и иконки из Figma в папку img/.
# Запускать на своём компьютере (нужен интернет): bash download-assets.sh
# Ссылки временные — действуют 7 дней с момента создания.

set -e
cd "$(dirname "$0")"
mkdir -p img
A=https://www.figma.com/api/mcp/asset
B=2bc6f8e3-f9f0-4586-acb8-2d63705e250c
C=f6191b3b-b8f5-4b8c-bedd-00b1a4ddf045
D=6b29d146-0758-4234-b8b1-3707946c45cb

dl() { curl -fL --retry 2 -o "img/$2" "$A/$1" && echo "ok  $2"; }

dl $B/2a3f4.png hero.png
dl $B/d1804.svg arrow-down.svg
dl $B/8466f.svg ic-instagram.svg
dl $B/e74a4.svg ic-telegram.svg
dl $B/7eda2.svg ic-tiktok.svg

dl $C/75ab5.png product-1.png
dl $C/710c2.png product-2.png
dl $C/0a53a.png product-3.png

dl $D/5eda3.png delivery-bg.png
dl $D/a08b9.png about-bg.png
dl $D/51c62.png contact-instagram.png
dl $D/714b0.png contact-telegram.png
dl $D/44002.png contact-tiktok.png
dl $D/aeb0f.svg ic-instagram-footer.svg
dl $D/fee13.svg ic-telegram-footer.svg
dl $D/5e40e.svg ic-tiktok-footer.svg

echo "Готово: файлы в img/"
