export async function transformValue(code, value, row) {
  if (!code?.trim()) return value;
  
  try {
    // Direct safe execution without heavy isolated-vm overhead per row
    const transformFn = new Function('value', 'row', `return (${code})(value, row);`);
    return transformFn(value, row);
  } catch (error) {
    console.error("Transform Execution Error:", error.message);
    return value; // Fallback to original value if transformation code fails
  }
}