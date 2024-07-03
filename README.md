<div align="center">

<img src="https://github.com/Ilhasoft/weni-webapp/raw/main/src/assets/LogoWeniAnimada.svg" height="100" />

[![Run Unit Tests, Lint Files and Build Project](https://github.com/weni-ai/chats-webapp/actions/workflows/test-and-build.yml/badge.svg?branch=main)](https://github.com/weni-ai/chats-webapp/actions/workflows/test-and-build.yml)
[![codecov](https://codecov.io/gh/weni-ai/chats-webapp/graph/badge.svg?token=4G62T5ER2Z)](https://codecov.io/gh/weni-ai/chats-webapp)

_This project is a module of [Weni](https://github.com/weni-ai) integrated inside [Weni WebApp (Connect)](https://github.com/weni-ai/weni-webapp)_

<br/>

# Weni Chats

Chats is the official human service module of the Weni platform.

</div>

<br/>

# About

With a well-structured and optimized code, Chats provides Weni platform users with an intuitive, efficient and highly personalized human service experience.

This repository has been carefully developed with our customers' needs and concerns in mind, with the aim of providing an exceptional auto-service experience.

> [Usability documentation](https://docs.weni.ai/l/pt/atendimento-humano)

<img src="https://github.com/weni-ai/chats-webapp/assets/69015179/712b36c8-a2b4-4307-9fb2-17c88a12fb08" />

<br/>

# Technologies

- [Vue 2](https://v2.vuejs.org/)
- [Sass](https://sass-lang.com/)
- [i18n](https://www.i18next.com/)
- [Axios](https://axios-http.com/ptbr/docs/intro)
- [Unnnic](https://github.com/weni-ai/unnnic) (Weni's design system)

<br/>

# Requirements

Before running the application, make sure you have installed the following tools on your machine:

- [Node.js 18.16.1](https://nodejs.org/en)
- [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/) (recommended)

<br/>

# Set up

1. Open the terminal and clone the repository

```
  git clone https://github.com/weni-ai/chats-webapp.git
```

2. Enter the created directory

```
  cd chats-webapp
```

3. Install the dependencies:

```
  yarn
```

<br/>

# How to develop

## Environment variables

1. Rename the .env.local.sample file to .env.local
2. Configure the .env.local following the patterns below

| Variable                    | Type     | Default   | Description                                                                                                 |
| --------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| VUE_APP_CHATS_API_URL       | `string` | Empty     | URN of the backend environment to API requests. Without protocol (http/https) and without slash at the end. |
| VUE_APP_CHATS_WEBSOCKET_URL | `string` | Empty     | URL of the backend environment to WebSocket requests. With protocol _wss_ and without slash at the end.     |
| VUE_APP_CHATS_ENVIRONMENT   | `string` | `develop` | Environment in which the project is running. Accepts `develop`, `staging` or `production`.                  |

<br/>

## Tokens

...

<br/>

## Execution

Start the server with:

```
  yarn run serve
```

After that, it will be available at http://localhost:8080.

<br/>

# Development Workflow

| Command                              | Description                                                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| yarn                                 | Install dependencies                                                                                                                                            |
| yarn serve                           | serve with hot reload at localhost:8080                                                                                                                         |
| yarn build                           | Build for production with minification                                                                                                                          |
| yarn build --report                  | Build for production and view the bundle analyzer report                                                                                                        |
| yarn translations:build              | Build translations for production                                                                                                                               |
| yarn translations:suggest-from-pt-br | Build translations for production with suggestions. Add at least one language in the translations file so that suggestions in other languages can be generated. |
| yarn lint                            | Show lint warnings and errors                                                                                                                                   |
| yarn test                       | Run all tests                                                                                                                                                   |
| yarn test --watch               | Run test in watch mode                                                                                                                                          |

<br/>

# Open-Source Governance

The Weni Platform open source projects are governed by @weni-ai. Weni opens all its software parts under terms of an open-source license to reach potential users and partners mainly. Secondly, Weni wants to reach developers by building a community for some pieces that are more reusable in other businesses or software projects, such as NLP models or tools. Besides that, the openness of our software is also related to building trust by enabling our external stakeholders to audit the security of our software.

<br/>

# Community

- Join our community chat to discuss with our internal team
- Join #dev for help from the community to development issues

<br/>

# Contributing

We are looking for collaboration from the Open Source community! There's so much we want to do, including but not limited to: enhancing existing applications with new features, optimizing the NLP tasks and algorithms involved that boost accuracy, new communication channels and integrations.

- Please read our contribution guidelines for details on what and how you can contribute.

- Report a bug by using this guideline for details on what and how you can contribute.
