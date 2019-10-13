const sorting = (function () {

    const DEFAULT_COLOR = '#777';
    const COMPARE_COLOR = '#00f';
    const SWAP_COLOR = '#f00';

    function randint(low, high) {
        // Return a random integer in the range [low, high] inclusive.
        return low + Math.floor((high - low + 1) * Math.random());
    }

    function draw_array(canvas, ary, colors) {
        let i;
        /*
                 * Draw an array on a canvas.
                 *
                 * Inputs:
                 * - canvas: a DOM canvas object
                 * - ary: An array of numbers to draw
                 * - colors: An array of the same length as ary, whose ith element
                 *   is a string giving the color for the ith element of ary
                 */
        const width_ratio = 2;
        const ctx = canvas.getContext('2d');

        // Clear the canvas
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Find min and max elements
        let min = ary[0];
        let max = ary[0];
        for (i = 1; i < ary.length; i++) {
            min = ary[i] < min ? ary[i] : min;
            max = ary[i] > max ? ary[i] : max;
        }

        // Figure out width of bars and spacing
        const n = ary.length;
        const spacing = canvas.width / (width_ratio * n + n + 1);
        const bar_width = spacing * width_ratio;

        // Draw a box around the outside of the canvas
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        function convert_y(y) {
            // Want convert_y(max) = 0, convert_y(min) = canvas.height`
            const a = canvas.height / (min - max);
            const b = max * canvas.height / (max - min);
            return a * y + b;
        }

        // Draw a baseline for zero
        const y_zero = convert_y(0);
        ctx.beginPath();
        ctx.moveTo(0, y_zero);
        ctx.lineTo(canvas.width, y_zero);
        ctx.stroke();

        // Now draw boxes
        let x = spacing;
        for (i = 0; i < ary.length; i++) {
            ctx.fillStyle = colors[i];
            const y = convert_y(ary[i]);
            if (ary[i] >= 0) {
                ctx.fillRect(x, y, bar_width, y_zero - y);
            } else {
                ctx.fillRect(x, y_zero, bar_width, y - y_zero);
            }
            x += spacing + bar_width;
        }
    }

    function AnimatedArray(ary, canvas, interval) {
        /*
         * An AnimatedArray wraps a pure Javascript array of numbers,
         * and provides functions to compare and swap elements of the array.
         * These comparisons and swaps will be visualized on a canvas.
         *
         * The AnimatedArray stores two copies of the array and a list of actions;
         * whenever one of the comparison or swap methods are called, the original
         * array is immediately updated and the action is added to the action list;
         * whenever _step() is called (which you should not call manually), one
         * action is consumed from the action list, the second copy of the array
         * is updated if needed, an the array is drawn to the canvas.
         *
         * This design lets clients of AnimatedArray use it in clean imperative
         * code without worrying about callbacks. The downside is that it uses
         * extra memory.
         *
         * Inputs to the constructor:
         * - ary: Pure Javascript array to wrap
         * - canvas: DOM canvas object where we will draw
         * - interval: Time (in milliseconds) between visualizing each step
         */
        this._ary = ary;
        this._canvas = canvas;
        this._ary_display = [];
        this._colors = [];
        this._actions = [];
        for (let i = 0; i < ary.length; i++) {
            this._ary_display.push(ary[i]);
            this._colors.push(DEFAULT_COLOR);
        }
        draw_array(this._canvas, this._ary, this._colors);
        const _this = this;
        this._id = window.setInterval(function () {
            _this._step();
        }, interval);
    }

    AnimatedArray.prototype.cancel = function () {
        /*
         * Cancel animations for any pending actions for this AnimatedArray.
         */
        window.clearInterval(this._id);
    };

    AnimatedArray.prototype.compare = function (i, j) {
        /*
         * Compare the elements at indices i and j.
         *
         * this.compare(i, j) > 0 iff this._ary[i] > this._ary[j].
         */
        this._actions.push(['compare', i, j]);
        return this._ary[i] - this._ary[j];
    };

    AnimatedArray.prototype.lessThan = function (i, j) {
        /*
         * Check whether this._ary[i] is less than this._ary[j].
         */
        return this.compare(i, j) < 0;
    };

    AnimatedArray.prototype.swap = function (i, j) {
        /*
         * Swap this._ary[i] and this._ary[j].
         */
        this._actions.push(['swap', i, j]);
        const t = this._ary[i];
        this._ary[i] = this._ary[j];
        this._ary[j] = t;
    };

    AnimatedArray.prototype._step = function () {
        /*
         * Consumes one step from the action buffer, using it to update
         * the display version of the array and the color array; then
         * draws the display array to the canvas. You should not call this
         * manually.
         */
        if (this._actions.length === 0) {
            draw_array(this._canvas, this._ary_display, this._colors);
            return;
        }
        const action = this._actions.shift();
        const i = action[1];
        const j = action[2];
        if (action[0] === 'compare') {
            this._colors[i] = COMPARE_COLOR;
            this._colors[j] = COMPARE_COLOR;
        } else if (action[0] === 'swap') {
            this._colors[i] = SWAP_COLOR;
            this._colors[j] = SWAP_COLOR;
            const t = this._ary_display[i];
            this._ary_display[i] = this._ary_display[j];
            this._ary_display[j] = t;
        }
        draw_array(this._canvas, this._ary_display, this._colors);
        this._colors[i] = DEFAULT_COLOR;
        this._colors[j] = DEFAULT_COLOR;
    };

    AnimatedArray.prototype.length = function () {
        return this._ary.length;
    };


    function bubblesort(aa) {
        const n = aa.length();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (aa.lessThan(j + 1, j)) {
                    aa.swap(j, j + 1);
                }
            }
        }
    }


    function selectionsort(aa) {
        const n = aa.length();
        for (let i = 0; i < n - 1; i++) {
            let min_j = i;
            for (let j = i; j < n; j++) {
                if (aa.lessThan(j, min_j)) min_j = j;
            }
            aa.swap(i, min_j);
        }
    }


    function insertionsort(aa) {
        const n = aa.length();
        for (let i = 1; i < n; i++) {
            for (let j = i; j > 0 && aa.lessThan(j, j - 1); j--) {
                aa.swap(j, j - 1);
            }
        }
    }


    function odd_even_sort(aa) {
        const n = aa.length();
        let sorted = false;
        while (!sorted) {
            sorted = true;
            for (let p = 0; p <= 1; p++) {
                for (let i = p; i + 1 < n; i += 2) {
                    if (aa.lessThan(i + 1, i)) {
                        aa.swap(i + 1, i);
                        sorted = false;
                    }
                }
            }
        }
    }


    function cocktail_sort(aa) {
        const n = aa.length();
        let left = 0;
        let right = n - 1;
        while (left < right) {
            let i;
            let new_right = right - 1;
            for (i = left; i + 1 <= right; i++) {
                if (aa.lessThan(i + 1, i)) {
                    aa.swap(i + 1, i);
                    new_right = i;
                }
            }
            right = new_right;
            let new_left = left + 1;
            for (i = right; i - 1 >= left; i--) {
                if (aa.lessThan(i, i - 1)) {
                    aa.swap(i, i - 1);
                    new_left = i;
                }
            }
            left = new_left;
        }
    }


    function choose_pivot(aa, pivot_type, left, right) {
        if (typeof (left) === 'undefined') left = 0;
        if (typeof (right) === 'undefined') right = aa.length() - 1;
        let pivot = null;
        if (pivot_type === 'random') {
            pivot = randint(left, right);
        } else if (pivot_type === 'first') {
            pivot = left;
        } else if (pivot_type === 'last') {
            pivot = right;
        } else if (pivot_type === 'middle') {
            pivot = Math.round((left + right) / 2);
        } else if (pivot_type === 'median3') {
            if (left + 1 === right) {
                // special case to avoid needless comparisons for small arrays
                pivot = left;
            } else {
                // Lots of cases to handle:
                // LMR, RML -> M
                // RLM, MLR -> L
                // LRM, MRL -> R
                const middle = Math.round((left + right) / 2);
                const LM = aa.lessThan(left, middle);
                const MR = aa.lessThan(middle, right);
                if (LM === MR) {
                    pivot = middle;
                } else if (LM && !MR) {
                    pivot = aa.lessThan(left, right) ? right : left;
                } else if (!LM && MR) {
                    pivot = aa.lessThan(left, right) ? left : right;
                }
            }
        } else {
            throw 'Invalid pivot_type ' + pivot_type;
        }
        return pivot;
    }


    function partition(aa, pivot_type, left, right) {
        let pivot = choose_pivot(aa, pivot_type, left, right);
        aa.swap(pivot, right);

        // Partition the array around the pivot.
        pivot = left;
        for (let i = left; i < right; i++) {
            if (aa.lessThan(i, right)) {
                if (i != pivot) {
                    aa.swap(i, pivot);
                }
                pivot += 1
            }
        }
        aa.swap(right, pivot);

        return pivot;
    }


    function quicksort(aa, pivot_type, left, right) {
        const n = aa.length();
        if (typeof (left) === 'undefined') left = 0;
        if (typeof (right) === 'undefined') right = n - 1;

        if (left >= right) return;

        const pivot = partition(aa, pivot_type, left, right);
        quicksort(aa, pivot_type, left, pivot - 1);
        quicksort(aa, pivot_type, pivot + 1, right);
    }


    function check_perm(perm) {
        // Check to see if an array is a valid permutation.
        let i;
        const n = perm.length;
        const used = {};
        for (i = 0; i < n; i++) {
            if (used[perm[i]]) return false;
            used[perm[i]] = true;
        }
        for (i = 0; i < n; i++) if (!used[i]) return false;
        return true;
    }


    function perm_to_swaps(perm) {
        /*
         *  Convert a permutation to a sequence of transpositions.
         *
         *  We represent a general permutation as a list of length N
         *  where each element is an integer from 0 to N - 1, with the
         *  interpretation that the element at index i will move to index
         *  perm[i].
         *
         *  In general any permutation can be written as a product of
         *  transpositions; we represent the transpostions as an array t of
         *  length-2 arrays, with the interpretation that we first swap
         *  t[0][0] with t[0][1], then swap t[1][0] with t[1][1], etc.
         *
         *  Input: perm, a permutation
         *  Returns: transpositions: a list of transpositions.
         */
        let i;
        if (!check_perm(perm)) {
            console.log(perm);
            throw "Invalid permutation";
        }
        const n = perm.length;
        const used = [];
        for (i = 0; i < n; i++) used.push(false);
        const transpositions = [];

        for (i = 0; i < n; i++) {
            if (used[i]) continue;
            let cur = i;
            if (perm[i] == i) used[i] = true;
            while (!used[perm[cur]]) {
                transpositions.push([cur, perm[cur]]);
                used[cur] = true;
                cur = perm[cur];
            }
        }

        return transpositions;
    }


    function mergesort(aa, left, right) {
        let i;
        if (typeof (left) === 'undefined') left = 0;
        if (typeof (right) === 'undefined') right = aa.length() - 1;

        if (left >= right) return;

        const mid = Math.floor((left + right) / 2);

        if (right - left > 1) {
            mergesort(aa, left, mid);
            mergesort(aa, mid + 1, right);
        }

        // Merge, building up a permutation. This could probably be prettier.
        let next_left = left;
        let next_right = mid + 1;
        const perm = [];
        for (i = left; i <= right; i++) {
            let choice = null;
            if (next_left <= mid && next_right <= right) {
                if (aa.lessThan(next_left, next_right)) {
                    choice = 'L';
                } else {
                    choice = 'R';
                }
            } else if (next_left > mid) {
                choice = 'R';
            } else if (next_right > right) {
                choice = 'L';
            }
            if (choice === 'L') {
                perm.push(next_left - left);
                next_left++;
            } else if (choice === 'R') {
                perm.push(next_right - left);
                next_right++;
            } else {
                throw 'Should not get here'
            }
        }

        const swaps = perm_to_swaps(perm);
        for (i = 0; i < swaps.length; i++) {
            aa.swap(swaps[i][0] + left, swaps[i][1] + left);
        }
    }

    function heapsort(aa, left, right) {
        if (typeof (left) === 'undefined') left = 0;
        if (typeof (right) === 'undefined') right = aa.length() - 1;
        const n = right - left + 1;

        function sift_down(start, end) {
            let root = start;
            while (true) {
                const left_child = 2 * (root - left) + 1 + left;
                const right_child = 2 * (root - left) + 2 + left;
                if (left_child > end) break;

                let swap = root;
                if (aa.lessThan(swap, left_child)) {
                    swap = left_child;
                }
                if (right_child <= end && aa.lessThan(swap, right_child)) {
                    swap = right_child;
                }
                if (swap === root) {
                    return;
                }
                aa.swap(root, swap);
                root = swap;
            }
        }

        // First build a heap
        let start = Math.floor(n / 2) - 1 + left;
        while (start >= left) {
            sift_down(start, right);
            start--;
        }

        // Now pop elements one by one, rebuilding the heap after each
        let end = right;
        while (end > left) {
            aa.swap(end, left);
            end--;
            sift_down(left, end);
        }
    }

    function introsort(aa, pivot_type, left, right, maxdepth) {
        if (typeof (left) === 'undefined') left = 0;
        if (typeof (right) === 'undefined') right = aa.length() - 1;

        const n = right - left + 1;
        if (typeof (maxdepth) === 'undefined') {
            maxdepth = 2 * Math.floor(Math.log(n) / Math.log(2));
        }

        if (n <= 1) return;
        if (maxdepth === 0) {
            heapsort(aa, left, right);
        } else {
            const pivot = partition(aa, pivot_type, left, right);
            introsort(aa, pivot_type, left, pivot, maxdepth - 1);
            introsort(aa, pivot_type, pivot + 1, right, maxdepth - 1);
        }
    }


    function bitonic_merge(aa, up, left, right) {
        const n = right - left + 1;
        let step = Math.floor(n / 2);
        while (step > 0) {
            for (let i = 0; i < n; i += step * 2) {
                let k = 0;
                for (let j = i; k < step; j++) {
                    const cmp = aa.compare(left + j, left + j + step);
                    if ((up && cmp > 0) || (!up && cmp < 0)) {
                        aa.swap(left + j, left + j + step);
                    }
                    k++;
                }
            }
            step = Math.floor(step / 2);
        }
    }


    function bitonic_mergesort(aa) {
        const n = aa.length();
        let n2 = 1;
        while (n2 < n) n2 *= 2;
        if (n !== n2) throw "Bitonic sort must use a power of 2";
        for (let s = 2; s <= n2; s *= 2) {
            for (let i = 0; i < n;) {
                bitonic_merge(aa, true, i, i + s - 1);
                bitonic_merge(aa, false, i + s, i + 2 * s - 1);
                i += s * 2;
            }
        }
    }


    const algorithms = {
        'bubblesort': bubblesort,
        'selectionsort': selectionsort,
        'odd_even_sort': odd_even_sort,
        'cocktail_sort': cocktail_sort,
        'insertionsort': insertionsort,
        'heapsort': heapsort,
        'quicksort': quicksort,
        'mergesort': mergesort,
        'introsort': introsort,
        'bitonic_mergesort': bitonic_mergesort,
    };

    function is_pivot_algo(algo) {
        const pivot_algos = {
            'quicksort': true,
            'introsort': true,
        };
        return pivot_algos.hasOwnProperty(algo);
    }

    function get_sort_fn(algo, pivot_type) {
        if (!algorithms.hasOwnProperty(algo)) {
            throw 'Invalid algorithm ' + algo;
        }
        const sort_fn = algorithms[algo];
        if (is_pivot_algo(algo)) {
            return function (aa) {
                sort_fn(aa, pivot_type);
            };
        } else {
            return sort_fn;
        }
    }

    return {
        'AnimatedArray': AnimatedArray,
        'get_sort_fn': get_sort_fn,
        'is_pivot_algo': is_pivot_algo,
        'algorithms': algorithms,
    };

})();
