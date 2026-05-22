/**
 * App — placeholder shell for Whispr Studio.
 *
 * T2 only scaffolds the project. The real App shell + state machine
 * (navigation, capture reducer, views) lands in T5.
 */
export default function App() {
  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1 className="serif" style={{ fontSize: 48, color: 'var(--accent)' }}>
        Whispr Studio
      </h1>
    </main>
  );
}
