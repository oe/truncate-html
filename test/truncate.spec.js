let truncate = require('../src/truncate');

describe('Truncate', () => {
    it('should', () => {
        let test = '<p> localeCompare(that: string) 32324234 </p>';

        expect(truncate(test, 7)).toBe('');
    });
});
