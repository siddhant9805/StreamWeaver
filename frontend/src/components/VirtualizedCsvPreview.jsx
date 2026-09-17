import React from 'react';
import { AutoSizer, Grid } from 'react-virtualized';
import 'react-virtualized/styles.css';

export default function VirtualizedCsvPreview({ columns = [], rows = [], failedRows = [], height = 420 }) {
  const failed = new Map((failedRows || []).map(item => [item.rowNumber, item.error]));
  const rowHeight = 42;
  const headerHeight = 44;
  const cell = ({ columnIndex, rowIndex, key, style }) => {
    const value = rowIndex === 0 ? columns[columnIndex] : rows[rowIndex - 1]?.[columns[columnIndex]];
    const error = rowIndex > 0 ? failed.get(rowIndex) : null;
    return (
      <div key={key} style={style} className={`virtual-cell ${rowIndex === 0 ? 'virtual-header' : ''} ${error ? 'virtual-error' : ''}`} title={error || String(value ?? '')}>
        {error && <span className="row-error-dot">!</span>}
        {String(value ?? '')}
      </div>
    );
  };
  if (!columns.length) return <div className="preview-empty">No CSV columns were detected.</div>;
  return (
    <div className="virtual-preview-shell" style={{ height }}>
      <AutoSizer>
        {({ width, height: autoHeight }) => (
          <Grid
            columnCount={columns.length}
            columnWidth={Math.max(150, Math.floor(width / Math.min(columns.length, 6)))}
            height={autoHeight}
            rowCount={Math.min(rows.length, 1000) + 1}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            width={width}
            cellRenderer={cell}
            overscanRowCount={8}
            overscanColumnCount={2}
          />
        )}
      </AutoSizer>
    </div>
  );
}
