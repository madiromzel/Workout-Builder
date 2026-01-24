import { useMemo, useState, useEffect, useRef } from "react";
import "./HardModeTasks.css";

export default function HardModeTasks() {
  const [blocks, setBlocks] = useState([]);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [rounds, setRounds] = useState(3);
  const [rest, setRest] = useState(30);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [dragId, setDragId] = useState(null);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState([]);
  const [timerOn, setTimerOn] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const prevPhaseRef = useRef(phase);
  const prevSecondsRef = useRef(secondsLeft);
  const prevTimerRef = useRef(timerOn);
  const audioCtxRef = useRef(null);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("manly-routine");
    if (saved) {
      setBlocks(JSON.parse(saved));
    }
    const savedPresets = localStorage.getItem("manly-presets");
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("manly-routine", JSON.stringify(blocks));
  }, [blocks]);

  const sequence = useMemo(() => {
    const items = [];
    blocks.forEach((block) => {
      for (let i = 0; i < block.rounds; i += 1) {
        items.push(block);
      }
    });
    return items;
  }, [blocks]);

  useEffect(() => {
    if (!timerOn || sequence.length === 0) return;

    if (secondsLeft === 0) {
      const current = sequence[activeIndex];
      if (!current) {
        setTimerOn(false);
        return;
      }

      const nextSeconds =
        phase === "work" ? current.minutes * 60 : current.restSeconds;
      setSecondsLeft(nextSeconds);
      return;
    }

    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === "work") {
            setPhase("rest");
          } else {
            const nextIndex = activeIndex + 1;
            if (nextIndex >= sequence.length) {
              setTimerOn(false);
              return 0;
            }
            setActiveIndex(nextIndex);
            setPhase("work");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [timerOn, sequence, activeIndex, phase, secondsLeft]);

  useEffect(() => {
    if (activeIndex >= sequence.length) {
      resetTimer();
    }
  }, [activeIndex, sequence.length]);

  function playBeep(frequency = 880, duration = 0.12) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevSeconds = prevSecondsRef.current;
    const prevTimer = prevTimerRef.current;

    if (!prevTimer && timerOn) {
      playBeep(880, 0.15);
    }

    if (timerOn && prevSeconds > 0 && secondsLeft === 0) {
      playBeep(660, 0.12);
    }

    if (timerOn && prevPhase !== phase && secondsLeft > 0) {
      playBeep(980, 0.12);
    }

    if (prevTimer && !timerOn && secondsLeft === 0 && sequence.length > 0) {
      playBeep(520, 0.2);
    }

    prevPhaseRef.current = phase;
    prevSecondsRef.current = secondsLeft;
    prevTimerRef.current = timerOn;
  }, [timerOn, phase, secondsLeft, sequence.length]);

  function addBlock() {
    if (!name.trim()) return;
    const block = {
      id: crypto.randomUUID(),
      name: name.trim(),
      minutes: Number(minutes) || 1,
      rounds: Number(rounds) || 1,
      restSeconds: Number(rest) || 0
    };
    setBlocks((prev) => [...prev, block]);
    setName("");
  }

  function saveEdit(id) {
    if (!editName.trim()) return;
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, name: editName.trim() } : block
      )
    );
    setEditingId(null);
    setEditName("");
  }

  function deleteBlock(id) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  }

  function startEdit(block) {
    setEditingId(block.id);
    setEditName(block.name);
  }

  function moveBlock(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = blocks.findIndex((block) => block.id === fromId);
    const toIndex = blocks.findIndex((block) => block.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const updated = [...blocks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setBlocks(updated);
  }

  function resetTimer() {
    setTimerOn(false);
    setActiveIndex(0);
    setPhase("work");
    setSecondsLeft(0);
  }

  function savePreset() {
    if (!presetName.trim() || blocks.length === 0) return;
    const next = [...presets, { name: presetName.trim(), blocks }];
    localStorage.setItem("manly-presets", JSON.stringify(next));
    setPresets(next);
    setPresetName("");
  }

  function loadPreset(nameToLoad) {
    const preset = presets.find((item) => item.name === nameToLoad);
    if (preset) {
      setBlocks(preset.blocks);
      resetTimer();
    }
  }

  function deletePreset(nameToDelete) {
    const next = presets.filter((item) => item.name !== nameToDelete);
    localStorage.setItem("manly-presets", JSON.stringify(next));
    setPresets(next);
  }

  const totalMinutes = blocks.reduce(
    (sum, block) => sum + block.minutes * block.rounds,
    0
  );
  const totalBlocks = blocks.length;
  const totalRounds = blocks.reduce((sum, block) => sum + block.rounds, 0);
  const timerLabel = secondsLeft
    ? `${Math.floor(secondsLeft / 60)
        .toString()
        .padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`
    : "00:00";
  const presetList = useMemo(() => presets, [presets]);

  return (
    <div className="planner">
      <header className="planner__hero">
        <div className="hero__glow" />
        <div className="hero__content">
          <p className="eyebrow">Workout Routine Builder</p>
          <h1>Train with intent. Own every round.</h1>
          <p className="subtitle">
            Build routines, drag to reorder, and run a live interval timer. This
            page flexes React state, motion, and UI polish without a backend.
          </p>
         
        </div>
        <div className="hero__stats">
          <div className="stat">
            <span className="stat__label">Today</span>
            <span className="stat__value">{today}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Total blocks</span>
            <span className="stat__value">{totalBlocks}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Total rounds</span>
            <span className="stat__value">{totalRounds}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Total minutes</span>
            <span className="stat__value">{totalMinutes}</span>
          </div>
        </div>
      </header>

      <main className="planner__body">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Routine blocks</h2>
              <p className="panel__hint">
                Drag to reorder. Build your daily routine like a program.
              </p>
            </div>
            <div className="panel__meta">Local only</div>
          </div>

          <div className="composer">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addBlock();
              }}
              placeholder="Block name (push, pull, cardio)"
              className="input"
            />
            <div className="composer__row">
              <label className="field">
                <span>Minutes</span>
                <input
                  type="number"
                  min="1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="input input--compact"
                />
              </label>
              <label className="field">
                <span>Rounds</span>
                <input
                  type="number"
                  min="1"
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  className="input input--compact"
                />
              </label>
              <label className="field">
                <span>Rest (sec)</span>
                <input
                  type="number"
                  min="0"
                  value={rest}
                  onChange={(e) => setRest(e.target.value)}
                  className="input input--compact"
                />
              </label>
              <button className="btn btn--primary" onClick={addBlock}>
                Add
              </button>
            </div>
          </div>

          <div className="list">
            {blocks.length === 0 ? (
              <div className="empty">
                No blocks yet. Add the first one and start the grind.
              </div>
            ) : (
              blocks.map((block, index) => (
                <article
                  className="task"
                  style={{ animationDelay: `${index * 70}ms` }}
                  key={block.id}
                  draggable
                  onDragStart={() => setDragId(block.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    moveBlock(dragId, block.id);
                    setDragId(null);
                  }}
                >
                  <div className="task__body">
                    {editingId === block.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input input--compact"
                        autoFocus
                      />
                    ) : (
                      <p className="task__text">{block.name}</p>
                    )}
                    <span className="task__id">
                      {block.minutes} min · {block.rounds} rounds · {block.restSeconds}s rest
                    </span>
                  </div>
                  <div className="task__actions">
                    {editingId === block.id ? (
                      <>
                        <button
                          className="btn btn--ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn--primary"
                          onClick={() => saveEdit(block.id)}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn--ghost"
                          onClick={() => startEdit(block)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--danger"
                          onClick={() => deleteBlock(block.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="sidebar">
          <div className="card">
            <h3>Interval timer</h3>
            <p>
              Block {activeIndex + 1} / {Math.max(sequence.length, 1)} · {phase.toUpperCase()}
            </p>
            <p className="muted">
              {sequence[activeIndex]?.name - "No active block"}
            </p>
            <div className="timer">
              <span>{timerLabel}</span>
            </div>
            <div className="timer__actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  if (sequence.length === 0) return;
                  setTimerOn((prev) => !prev);
                }}
              >
                {timerOn ? "Pause" : "Start"}
              </button>
              <button className="btn btn--ghost" onClick={resetTimer}>
                Reset
              </button>
            </div>
          </div>
          <div className="card">
            <h3>Presets</h3>
            <p>Save and reload routines locally.</p>
            <div className="preset">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="input input--compact"
              />
              <button className="btn btn--primary" onClick={savePreset}>
                Save
              </button>
            </div>
            <div className="preset__list">
              {presetList.length === 0 ? (
                <span className="muted">No presets saved.</span>
              ) : (
                presetList.map((preset) => (
                  <div className="preset__item" key={preset.name}>
                    <span>{preset.name}</span>
                    <div>
                      <button
                        className="btn btn--ghost"
                        onClick={() => loadPreset(preset.name)}
                      >
                        Load
                      </button>
                      <button
                        className="btn btn--danger"
                        onClick={() => deletePreset(preset.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card">
            <h3>Features</h3>
            <ul>
              <li>Drag and drop ordering</li>
              <li>LocalStorage persistence</li>
              <li>Interval timer engine</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
