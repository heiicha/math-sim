# Math Sim

Math Sim is a set of interactive visualizations for H2 Math topics. I used NJC's math notes to base the definitions, wording, and concepts from. Instead of just reading a formula, you can drag vectors around, change graph steps, and watch the result update as you go. The explanations and wording follow the lecture notes in the `notes` folder.

The live site is at https://heiicha.github.io/math-sim/

## Running it locally

You need Node.js installed.

1. Clone the repo and open the folder in a terminal.
2. Install the dependencies:

   ```bash
   npm install --include=dev
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Follow instructions provided !

## Topics

### Vectors I (2D)

Two or more vectors on a grid that you can drag by their tips, tails or bodies, or edit by typing in the components.

- Dot product, with the angle between the vectors and the projection line drawn in
- Cross product, shading the parallelogram or triangle whose area it gives
- Addition, with up to four vectors
- Subtraction
- Projection, split into the part along b and the part perpendicular to it
- Ratio theorem, showing where P sits on AB for a given ratio
- Collinearity, checking whether three points lie on one line

### Vectors II (3D)

A 3D scene you can rotate and zoom, with points and direction vectors you can drag.
- Vector and Cartesian forms of lines and planes
- Line and plane: parallel, contained or intersecting, and the angle between them
- Line and line: intersecting, parallel or skew, with the shortest distance
- Plane and plane: angle, distance, line of intersection and reflections
- Point and line, point and plane: foot of the perpendicular, shortest distance and reflection

### Transformations of Graphs

Type in any function of x and apply translations, scalings and reflections. The original graph stays on screen so you can compare. The sandbox lets you stack several steps together and shows the final equation.

### Permutations and Combinations

Counting principles, arrangements in a row (including with repetition or identical objects), circular arrangements and combinations, each with a small picture of what is being counted.

### Normal Distribution

- The normal curve, with sliders for the mean and standard deviation and an option to show the 68/95/99.7 bands
- Normal probabilities, worked out like `normalcdf` on a graphing calculator
- Inverse normal, like `invNorm`
- Linear combinations of two normal variables

### Hypothesis Testing

Walks through a z-test for a population mean: writing the hypotheses, running the test, and seeing the critical region and p-value on the curve. There is also a case explorer for working out which distribution of the sample mean to use, depending on whether the population is normal, whether the variance is known and how big the sample is.

## Other things
- The 2D vectors and graphs pages have a Reset view button that puts the view back where it started.
- Light and dark mode, using the button on the top right.

## Built with
React, Vite, p5.js for the 2D canvases and three.js for the 3D scene