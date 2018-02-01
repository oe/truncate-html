import buble from 'rollup-plugin-buble';

export default {
    input: 'src/truncate.js',
    output: {
        name: 'truncate-html',
        format: process.env.format,
        file: `dist/truncate.${process.env.format}.js`
    },
    plugins: [
        buble()
    ]
};
