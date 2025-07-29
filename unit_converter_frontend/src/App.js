import React, { useState, useEffect } from 'react';
import './App.css';

/*
 * Universal Unit Converter - React Frontend
 * Implements: Header, category selection, input/output, units, result, currency panel, (minimal) history
 * Theming uses: --primary: #0077c2; --accent: #43a047; --secondary: #e0e0e0;
 * Responsive, modern minimalistic design
 * Makes HTTP requests to backend REST API for conversions.
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000"; // Should be set in .env

// Simple static config for categories and example units.
// In a real app, these would come from backend endpoints for available categories & units.
const staticConfig = {
  Length: ['meter', 'kilometer', 'mile', 'inch', 'foot'],
  Weight: ['gram', 'kilogram', 'pound', 'ounce'],
  Temperature: ['celsius', 'fahrenheit', 'kelvin'],
  Speed: ['meter_per_second', 'kilometer_per_hour', 'mile_per_hour'],
  Currency: ['USD', 'EUR', 'GBP', 'JPY', 'INR'],
};

// PUBLIC_INTERFACE
function App() {
  /* State management */
  const [category, setCategory] = useState('Length');
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState('meter');
  const [toUnit, setToUnit] = useState('kilometer');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Currency conversion state
  const [enableCurrency, setEnableCurrency] = useState(false);
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('EUR');
  const [currencyValue, setCurrencyValue] = useState('');
  const [currencyResult, setCurrencyResult] = useState('');

  // Conversion history (optional)
  const [history, setHistory] = useState([]);

  /* Update unit lists when category changes */
  useEffect(() => {
    const units = staticConfig[category];
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  }, [category]);

  // Add to history on result update (optional)
  useEffect(() => {
    if (result && value && fromUnit && toUnit && !error && !isLoading && category !== 'Currency') {
      setHistory(hist => [
        { category, value, fromUnit, toUnit, result, timestamp: Date.now() },
        ...hist.slice(0, 9) // Keep max 10 entries
      ]);
    }
  // Only run on result changes from "classic" units
  // eslint-disable-next-line
  }, [result]);

  // PUBLIC_INTERFACE
  const handleConvert = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setIsLoading(true);

    // Backend endpoint for general unit conversion
    try {
      const res = await fetch(`${API_BASE}/convert`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          category,
          value,
          from_unit: fromUnit,
          to_unit: toUnit
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Conversion failed.');
        setResult('');
      } else {
        setResult(`${data.result} ${toUnit}`);
      }
    } catch (err) {
      setError('Could not reach backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleCurrencyConvert = async (e) => {
    e.preventDefault();
    setCurrencyResult('');
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/convert-currency`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          amount: currencyValue,
          from_currency: currencyFrom,
          to_currency: currencyTo
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Currency conversion failed.');
        setCurrencyResult('');
      } else {
        setCurrencyResult(`${data.result} ${currencyTo}`);
      }
    } catch (err) {
      setError('Could not reach backend for currency.');
    } finally {
      setIsLoading(false);
    }
  };

  /* Color theme variables via inline style */
  useEffect(() => {
    document.body.style.setProperty('--primary', '#0077c2');
    document.body.style.setProperty('--accent', '#43a047');
    document.body.style.setProperty('--secondary', '#e0e0e0');
  }, []);

  return (
    <div className="App" style={{background: 'var(--secondary)'}}> {/* Light bg */}
      <Header primary="#0077c2"/>
      <main className="converter-main">
        <section className="converter-panel">
          <form className="converter-form" onSubmit={handleConvert}>
            <div className="row">
              <label className="label" htmlFor="category">Category</label>
              <select
                className="dropdown"
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{borderColor: 'var(--primary)'}}
              >
                {Object.keys(staticConfig).filter(cat => cat !== 'Currency').map(cat =>
                  <option value={cat} key={cat}>{cat}</option>
                )}
              </select>
            </div>
            <div className="row">
              <label className="label" htmlFor="value">Value</label>
              <input
                className="input"
                id="value"
                type="number"
                placeholder="Enter value"
                value={value}
                onChange={e => setValue(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="row">
              <label className="label" htmlFor="fromUnit">From</label>
              <select
                className="dropdown"
                id="fromUnit"
                value={fromUnit}
                onChange={e => setFromUnit(e.target.value)}
              >
                {staticConfig[category].map(unit =>
                  <option value={unit} key={unit}>{formatUnit(unit)}</option>
                )}
              </select>
            </div>
            <div className="row">
              <label className="label" htmlFor="toUnit">To</label>
              <select
                className="dropdown"
                id="toUnit"
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
              >
                {staticConfig[category].map(unit =>
                  <option value={unit} key={unit}>{formatUnit(unit)}</option>
                )}
              </select>
            </div>
            <div className="row">
              <button
                className="btn-primary"
                type="submit"
                disabled={isLoading || !value}
                style={{backgroundColor: 'var(--primary)'}}
              >
                {isLoading ? 'Converting...' : 'Convert'}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            {result &&
              <div className="result">
                Result:<br/>
                <span className="result-value">{result}</span>
              </div>
            }
          </form>
        </section>

        {/* (Optional) Currency conversion, can be toggled */}
        <section className="currency-panel">
          <div className="currency-toggle-row">
            <label>
              <input
                type="checkbox"
                checked={enableCurrency}
                onChange={e => setEnableCurrency(e.target.checked)}
              />
              <span style={{marginLeft:8,fontWeight:600}}>Enable currency converter</span>
            </label>
          </div>
          {enableCurrency && (
            <form className="currency-form" onSubmit={handleCurrencyConvert}>
              <div className="row">
                <label className="label">Amount</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Amount"
                  value={currencyValue}
                  onChange={e => setCurrencyValue(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="row">
                <label className="label">From</label>
                <select
                  className="dropdown"
                  value={currencyFrom}
                  onChange={e => setCurrencyFrom(e.target.value)}
                >
                  {staticConfig.Currency.map(cur =>
                    <option value={cur} key={cur}>{cur}</option>
                  )}
                </select>
              </div>
              <div className="row">
                <label className="label">To</label>
                <select
                  className="dropdown"
                  value={currencyTo}
                  onChange={e => setCurrencyTo(e.target.value)}
                >
                  {staticConfig.Currency.map(cur =>
                    <option value={cur} key={cur}>{cur}</option>
                  )}
                </select>
              </div>
              <div className="row">
                <button
                  className="btn-accent"
                  type="submit"
                  disabled={isLoading || !currencyValue}
                  style={{backgroundColor: 'var(--accent)'}}
                >
                  {isLoading ? 'Converting...' : 'Convert Currency'}
                </button>
              </div>
              {currencyResult &&
                <div className="result result-currency">
                  Result:
                  <span className="result-value">{currencyResult}</span>
                </div>
              }
            </form>
          )}
        </section>

        {/* (Optional) Conversion History */}
        <section className="history-panel">
          {history.length > 0 &&
            <>
            <h3 className="history-title">Recent conversions</h3>
            <ul className="history-list">
              {history.map((item, idx) =>
                <li key={item.timestamp + String(idx)} className="history-entry">
                  <span className="hcat">{item.category}</span>&nbsp;
                  <span>{item.value} {formatUnit(item.fromUnit)} → <b>{item.result}</b> ({formatUnit(item.toUnit)})</span>
                </li>
              )}
            </ul>
            </>
          }
        </section>
      </main>
      <Footer/>
    </div>
  );
}

// PUBLIC_INTERFACE
function Header({primary}) {
  return (
    <header className="header-bar" style={{
      background: 'var(--primary)',
      color: '#fff',
      padding: '1rem 0',
      marginBottom: 12,
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '0.02em',
      boxShadow: '0 2px 14px #0001'
    }}>
      <span role="img" aria-label="Convert">🔄</span> Universal Unit Converter
    </header>
  );
}

// PUBLIC_INTERFACE
function Footer() {
  return (
    <footer className="footer" style={{
      marginTop: 48,
      color: '#888',
      fontSize: '1rem',
      padding: 16
    }}>
      © 2024 Kavia Universal Unit Converter.
    </footer>
  );
}

function formatUnit(unit) {
  // Make unit nicer for display
  if (!unit) return '';
  return unit.replace(/_/g, ' ').replace(/\b([a-z])/g, c => c.toUpperCase());
}

export default App;
