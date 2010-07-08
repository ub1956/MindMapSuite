#!/bin/sh
#
# This script is aimed to compress several files with the help of yuicompressor
# These scripts are going to be compressed:
# ../mindedit/mindedit.js -> ../mindedit/mindedit.c.js
# ../mindview/mindview.js -> ../mindview/mindview.c.js
# ../css/style.mindview.css -> ../css/style.mindview.c.css
# ../css/style.mindedit.css -> ../css/style.mindedit.c.css
# ../css/style.generic.css -> ../css/style.generic.c.css
java -jar yuicompressor-2.4.2.jar -v -o ../mindedit/mindedit.c.js ../mindedit/mindedit.js
java -jar yuicompressor-2.4.2.jar -v -o ../mindview/mindview.c.js ../mindview/mindview.js
java -jar yuicompressor-2.4.2.jar -v -o ../css/style.mindview.c.css ../css/style.mindview.css
java -jar yuicompressor-2.4.2.jar -v -o ../css/style.mindedit.c.css ../css/style.mindedit.css
java -jar yuicompressor-2.4.2.jar -v -o ../css/style.generic.c.css ../css/style.generic.css



