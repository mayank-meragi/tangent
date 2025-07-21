# Commands Directory

This directory contains all the plugin commands organized by functionality.

## Structure

```
commands/
├── index.ts              # Main export file for all commands
├── README.md             # This documentation file
└── tagSuggest/           # AI Tag Suggest command
    ├── index.ts          # Main command implementation
    └── types.ts          # TypeScript interfaces and types
```

## Adding New Commands

To add a new command:

1. **Create a new directory** for your command under `commands/`
2. **Create an `index.ts`** file with your command implementation
3. **Create a `types.ts`** file for any custom types
4. **Export your command** from the main `commands/index.ts`
5. **Register the command** in `main.tsx`

### Example Command Structure

```typescript
// commands/myCommand/index.ts
import { App } from 'obsidian';

export interface MyCommandOptions {
  app: App;
}

export class MyCommand {
  private app: App;

  constructor(options: MyCommandOptions) {
    this.app = options.app;
  }

  async execute(): Promise<void> {
    // Command implementation
  }

  static getCommandConfig() {
    return {
      id: 'my-command',
      name: 'My Command',
    };
  }
}

export function createMyCommand(app: App): MyCommand {
  return new MyCommand({ app });
}
```

### Registration in main.tsx

```typescript
// In main.tsx onload() method
this.addCommand({
  id: 'my-command',
  name: 'My Command',
  callback: async () => {
    const myCommand = createMyCommand(this.app);
    await myCommand.execute();
  }
});
```

## Current Commands

- **tagSuggest**: AI-powered tag suggestion for notes 