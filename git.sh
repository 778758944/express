#!/bin/bash
xx=$1
kk=${xx:-"modify"}
git add .
git commit -m "$kk"
git pull
git push -u origin master
echo "done"
