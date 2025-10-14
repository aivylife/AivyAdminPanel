# Aivy Admin Panel

Admin panel for Aivy project.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment

The application is automatically deployed via GitHub Actions when changes are pushed to the master branch.
The deployment process includes:

- Building Docker image
- Pushing to GitHub Container Registry
- Deploying to production server

Deployment URL: https://aivy.mobgroup.kz/adminpanel

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
