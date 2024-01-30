import scss from 'rollup-plugin-scss';

export default {
  input: './talent-psionics.mjs',
  output: {
    file: './talent-psionics-compiled.mjs',
    format: 'esm',
  },
  plugins: [
    scss({
      include: ['./styles/*.scss'],
      output: './talent-psionics.css',
      failOnError: true,
    }),
  ],
};
