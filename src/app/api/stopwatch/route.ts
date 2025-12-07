import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple file-based persistence for global stopwatch state
// This ensures all sessions share the same timer state
const STOPWATCH_FILE = path.join(process.cwd(), 'data', 'stopwatch.json');

interface StopwatchState {
    startedAt: string | null;  // ISO timestamp when timer started (UTC)
    targetSeconds: number;      // Target duration in seconds
    finished: boolean;          // Whether the timer has finished
}

function ensureDataDir() {
    const dir = path.dirname(STOPWATCH_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readState(): StopwatchState {
    try {
        if (fs.existsSync(STOPWATCH_FILE)) {
            const data = fs.readFileSync(STOPWATCH_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading stopwatch state:', e);
    }
    return { startedAt: null, targetSeconds: 0, finished: false };
}

function writeState(state: StopwatchState) {
    ensureDataDir();
    fs.writeFileSync(STOPWATCH_FILE, JSON.stringify(state, null, 2));
}

// GET: Retrieve current stopwatch state
export async function GET() {
    const state = readState();

    let elapsedSeconds = 0;
    let running = false;

    if (state.startedAt) {
        const startTime = new Date(state.startedAt).getTime();
        const now = Date.now();
        elapsedSeconds = Math.floor((now - startTime) / 1000);
        running = true;

        // Check if finished
        if (state.targetSeconds > 0 && elapsedSeconds >= state.targetSeconds) {
            elapsedSeconds = state.targetSeconds;
            // Auto-stop when target reached
        }
    }

    return NextResponse.json({
        startedAt: state.startedAt,
        targetSeconds: state.targetSeconds,
        elapsedSeconds,
        running: state.startedAt !== null
    });
}

// POST: Control the stopwatch (start, stop, reset, setTarget)
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { action, targetSeconds } = body;

    const state = readState();

    switch (action) {
        case 'start':
            if (!state.startedAt) {
                state.startedAt = new Date().toISOString();
            }
            break;

        case 'stop':
            state.startedAt = null;
            break;

        case 'reset':
            state.startedAt = null;
            break;

        case 'setTarget':
            if (typeof targetSeconds === 'number') {
                state.targetSeconds = targetSeconds;
            }
            break;

        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    writeState(state);

    return NextResponse.json({ success: true, state });
}
