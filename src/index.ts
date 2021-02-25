#!/usr/bin/env node

const { parseVueComponent } = require("../lib/parse-vue-component");
const parsed = parseVueComponent(process.argv[2]);
console.log(parsed);
