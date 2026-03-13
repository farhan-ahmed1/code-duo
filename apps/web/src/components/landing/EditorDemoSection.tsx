export default function EditorDemoSection() {
  return (
    <section className="editor-section">
      <div className="container">
        <div className="editor-layout">
          <div>
            <div className="section-label">Live demo</div>
            <h2 className="section-title">
              Two cursors,
              <br />
              <span style={{ color: "var(--blue)" }}>one editor</span>
            </h2>
            <p className="section-desc">
              Watch Alice and Bob edit the same file with live presence,
              real-time sync, and conflict-free convergence.
            </p>

            <div className="presence-badges" style={{ marginTop: "32px" }}>
              <div className="presence-badge">
                <div
                  className="presence-avatar"
                  style={{ background: "var(--blue)" }}
                >
                  A
                </div>
                <span>Alice</span>
                <div className="online-dot" />
              </div>
              <div className="presence-badge">
                <div
                  className="presence-avatar"
                  style={{ background: "var(--green)" }}
                >
                  B
                </div>
                <span>Bob</span>
                <div className="online-dot" />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-lp-mono)",
                  fontSize: "11px",
                  color: "var(--text-dim)",
                  padding: "6px 12px",
                  border: "1px dashed var(--lp-border)",
                  borderRadius: "100px",
                }}
              >
                + share link
              </div>
            </div>

            <div
              style={{
                marginTop: "32px",
                padding: "20px",
                background: "var(--bg2)",
                border: "1px solid var(--lp-border)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-lp-mono)",
                  fontSize: "11px",
                  color: "var(--text-dim)",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Room info
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {[
                  {
                    label: "room",
                    value: "abc-123-xyz",
                    color: "var(--text-muted)",
                  },
                  {
                    label: "language",
                    value: "TypeScript",
                    color: "var(--text-muted)",
                  },
                  {
                    label: "connected",
                    value: "2 live",
                    color: "var(--text-muted)",
                  },
                  {
                    label: "sync model",
                    value: "CRDT + WS",
                    color: "var(--text-muted)",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-dim)",
                        fontFamily: "var(--font-lp-mono)",
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ color, fontFamily: "var(--font-lp-mono)" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor mock */}
          <div className="editor-mock">
            <div className="editor-titlebar">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontFamily: "var(--font-lp-mono)",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                code duo — collab.ts
              </div>
              <div
                style={{ display: "flex", gap: "4px", alignItems: "center" }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--blue)",
                    boxShadow: "0 0 0 2px #161b22",
                  }}
                />
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    marginLeft: "-4px",
                    boxShadow: "0 0 0 2px #161b22",
                  }}
                />
              </div>
            </div>
            <div className="editor-tabs">
              <div className="editor-tab active">collab.ts</div>
              <div className="editor-tab">room.ts</div>
              <div className="editor-tab">types.ts</div>
              <div style={{ flex: 1, background: "#161b22" }} />
            </div>
            <div className="editor-body">
              <div className="line-nums">
                {Array.from({ length: 11 }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="code-lines">
                <div className="code-line">
                  <span className="tok-keyword">import</span>{" "}
                  <span className="tok-punct">{"{ "}</span>
                  <span className="tok-type">Doc</span>
                  <span className="tok-punct">{" }"}</span>{" "}
                  <span className="tok-keyword">from</span>{" "}
                  <span className="tok-string">&quot;yjs&quot;</span>
                  <span className="tok-punct">;</span>
                </div>
                <div className="code-line active-line">
                  <span className="tok-keyword">import</span>{" "}
                  <span className="tok-punct">{"{ "}</span>
                  <span className="tok-type">WebsocketProvider</span>
                  <span className="tok-punct">{" }"}</span>{" "}
                  <span className="tok-keyword">from</span>{" "}
                  <span className="tok-string">&quot;y-websocket&quot;</span>
                  <span className="tok-punct">;</span>
                  <span className="cursor-a" />
                </div>
                <div className="code-line">&nbsp;</div>
                <div className="code-line">
                  <span className="tok-keyword">const</span>{" "}
                  <span className="tok-var">doc</span>{" "}
                  <span className="tok-punct">= </span>
                  <span className="tok-keyword">new</span>{" "}
                  <span className="tok-type">Doc</span>
                  <span className="tok-punct">();</span>
                </div>
                <div className="code-line">
                  <span className="tok-keyword">const</span>{" "}
                  <span className="tok-var">provider</span>{" "}
                  <span className="tok-punct">= </span>
                  <span className="tok-keyword">new</span>{" "}
                  <span className="tok-type">WebsocketProvider</span>
                  <span className="tok-punct">(</span>
                </div>
                <div className="code-line">
                  <span className="tok-punct">{"  "}</span>
                  <span className="tok-string">
                    &quot;wss://code-duo.dev&quot;
                  </span>
                  <span className="tok-punct">, </span>
                  <span className="tok-string">&quot;room-1&quot;</span>
                  <span className="tok-punct">, </span>
                  <span className="tok-var">doc</span>
                  <span className="tok-punct">);</span>
                </div>
                <div className="code-line">&nbsp;</div>
                <div className="code-line">
                  <span className="tok-comment">
                    {"// Real-time, conflict-free"}
                  </span>
                </div>
                <div className="code-line active-line">
                  <span className="tok-keyword">const</span>{" "}
                  <span className="tok-var">text</span>{" "}
                  <span className="tok-punct">= </span>
                  <span className="tok-var">doc</span>
                  <span className="tok-punct">.</span>
                  <span className="tok-fn">getText</span>
                  <span className="tok-punct">(</span>
                  <span className="tok-string">&quot;editor&quot;</span>
                  <span className="tok-punct">);</span>
                  <span className="cursor-b" />
                </div>
                <div className="code-line">
                  <span className="tok-var">text</span>
                  <span className="tok-punct">.</span>
                  <span className="tok-fn">observe</span>
                  <span className="tok-punct">{"(() => {"}</span>
                </div>
                <div className="code-line">
                  <span className="tok-punct">{"  "}</span>
                  <span className="tok-var">console</span>
                  <span className="tok-punct">.</span>
                  <span className="tok-fn">log</span>
                  <span className="tok-punct">(</span>
                  <span className="tok-var">text</span>
                  <span className="tok-punct">.</span>
                  <span className="tok-fn">toString</span>
                  <span className="tok-punct">());</span>
                </div>
                <div className="code-line">
                  <span className="tok-punct">{"});"}</span>
                </div>
              </div>
            </div>
            <div className="editor-statusbar">
              <div className="status-left">
                <span
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.3)",
                    }}
                  />
                  Connected
                </span>
                <span>2 users</span>
              </div>
              <div className="status-right">
                <span>TypeScript</span>
                <span>UTF-8</span>
                <span>LF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
