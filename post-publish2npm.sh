#!/usr/bin/env bash
# color table
# Black        0;30     Dark Gray     1;30
# Red          0;31     Light Red     1;31
# Green        0;32     Light Green   1;32
# Brown/Orange 0;33     Yellow        1;33
# Blue         0;34     Light Blue    1;34
# Purple       0;35     Light Purple  1;35
# Cyan         0;36     Light Cyan    1;36
# Light Gray   0;37     White         1;37

# colors
red='\033[0;31m'
green='\033[0;32m'
grey='\033[0;37m'
# no color
NC='\033[0m'

# trim string
trim() {
  local var="$*"
  # remove leading whitespace characters
  var="${var#"${var%%[![:space:]]*}"}"
  # remove trailing whitespace characters
  var="${var%"${var##*[![:space:]]}"}"
  echo -n "$var"
}

# tag
# read package.json's version
version=`cat package.json | awk -F [:] '/version/{print $2}' | sed 's/[\"\,]//g'`
tag="v`trim ${version}`"

git tag "${tag}"
git push origin "${tag}"

echo -e "\n${green}New Tag ${tag} has been push to origin:)"
