/**
 * Application-wide constants
 */

/**
 * Token package definitions
 * @type {Array<{id: string, tokens: number, amount: number, description: string}>}
 */
export const TOKEN_PACKAGES = [
  { id: "basic", tokens: 10000, amount: 499, description: "Basic Package" },
  {
    id: "standard",
    tokens: 25000,
    amount: 999,
    description: "Standard Package",
  },
  {
    id: "premium",
    tokens: 50000,
    amount: 1799,
    description: "Premium Package",
  },
];

/**
 * Get package details by ID
 * @param {string} packageId - The package ID
 * @returns {Object|undefined} Package details or undefined if not found
 */
export function getPackageById(packageId) {
  return TOKEN_PACKAGES.find((pkg) => pkg.id === packageId);
}
