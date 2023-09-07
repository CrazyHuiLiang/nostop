#!/bin/bash
# 将当前分支推送至指定分支

dest_branch=$1
branch=$(git branch --show-current)
git push
git checkout $dest_branch
git pull
git merge --no-verify -m "Merge branch "$branch $branch
git push
git checkout $branch
