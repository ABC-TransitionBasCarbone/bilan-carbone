# MIP Survey App

A survey system for carbon footprint assessment, inspired by the nosgestesclimat-app question logic.

## Features

- ✅ **Core Survey Engine**: Question navigation, validation, and state management
- ✅ **Question Types**: Text input and single choice (MVP)
- ✅ **UUID-based URLs**: Each survey response has a unique URL
- ✅ **LocalStorage Persistence**: Answers are saved automatically
- ✅ **Progress Tracking**: Visual progress bar and question counter
- ✅ **Zustand State Management**: Efficient and simple state management
- ✅ **Material-UI Components**: Modern and accessible UI

## Getting Started

### Installation

```bash
# From the monorepo root
yarn install

# Or from apps/mip
cd apps/mip
yarn install
```

### Development

```bash
# Start development server (runs on port 3002)
yarn dev

# Or from monorepo root
yarn workspace mip dev
```

### Build

```bash
yarn build
yarn start
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
