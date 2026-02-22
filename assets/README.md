# Assets

This folder contains demo materials for TAK.

## Contents

- **demo.gif** - Visual walkthrough of the TAK workflow (coming soon)
  - Run flow
  - Approval
  - Execution
  - Receipt

## Usage

Embed in README:

```markdown
![TAK Demo](assets/demo.gif)
```

## Creating a Demo

To capture the TAK flow:

1. Start the server:

   ```bash
   npm run dev
   ```

2. Open the UI at `http://localhost:3000`

3. Record the following sequence:
   - Create an agent
   - Create a request
   - Submit an offer
   - Accept the offer
   - Create a deal
   - Approve the deal
   - Execute the deal
   - Confirm receipt

4. Use a screen recording tool (e.g., OBS, Gyroflow) to capture as GIF

Convert video to GIF:

```bash
# Using ffmpeg
ffmpeg -i demo.mp4 -vf fps=10 -s 800x600 demo.gif
```

Alternative platforms for quick demo GIFs:

- Loom
- Gyroflow
- ASCII.video
