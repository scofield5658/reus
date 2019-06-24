# reus

[![NPM version][npm-image]][npm-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![npm license][license-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/reus.js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/reus.js
[node-image]: https://img.shields.io/badge/node.js-%3E=_8.9.4-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/reus.js.svg?style=flat-square
[download-url]: https://npmjs.org/package/reus.js
[license-image]: https://img.shields.io/npm/l/reus.js.svg

> cli for webapp development &amp; deployment by nodejs

## What is it

Reus.js is a webapp framework based on koa.js, which utilizes a useful consequence of the encapsulation principle. Developers are easily focused on implementations for production/business requirements, rather than the versions of dependencies or the scaffold a team project required.

## Why should I use it

Reus.js has the core consideration for enterprise situation. Dealing with multiple projects, an R&D manager usually needs a widely covered version control, such as scaffolds controlls, third party libraries/dependencies controlls, etc.. This problem can be solved by one simple step, add reus.js into the dependency list. It provides a whole lifecycle coverage for the project's development & deployment.

## Installation

```bash
$ npm install -g reus.js
```

Node.js >= 8.9.4 required. (I do not test it in any node environment lower than that version. Someone may have a nice try O(∩_∩)O~~)

## Features

- Commands for Create/Launch/Build Your Project
- Process Management for Launch in DevMode
- Gulp Based Plugin Development

## Getting Started

- Initialization
  ```bash
  $ reus create -t scofield5658/reus-simple-starter
  $ cd reus-simple-starter
  $ npm i
  ```

- Create a Controller

- Create a Middleware

- Build-in Methods

- How to build

- How to deploy

- Plugin

## License

[MIT](LICENSE)
