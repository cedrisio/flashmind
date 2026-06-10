/**
 * scores.js — FlashMind session score store
 *
 * Uses sessionStorage so scores persist across page navigations
 * within the same browser tab, but reset automatically when the
 * tab is closed. Nothing is written to localStorage or sent anywhere.
 *
 * Game IDs: 'game1' (Number Flash), 'game2' (N-Back)
 */

const FlashmindScores = {

  /**
   * Get the current session high score for a game.
   * @param {string} game - 'game1' or 'game2'
   * @returns {number} high score, or 0 if none set
   */
  get(game) {
    const raw = sessionStorage.getItem(`fm_hs_${game}`);
    return raw !== null ? parseInt(raw, 10) : 0;
  },

  /**
   * Submit a score. Only updates if it beats the stored high score.
   * @param {string} game  - 'game1' or 'game2'
   * @param {number} score - score to submit
   * @returns {boolean} true if a new high score was set
   */
  submit(game, score) {
    const current = this.get(game);
    if (score > current) {
      sessionStorage.setItem(`fm_hs_${game}`, String(score));
      return true; // new high score!
    }
    return false;
  },

  /**
   * Clear the high score for a game.
   * @param {string} game - 'game1' or 'game2'
   */
  clear(game) {
    sessionStorage.removeItem(`fm_hs_${game}`);
  }

};
