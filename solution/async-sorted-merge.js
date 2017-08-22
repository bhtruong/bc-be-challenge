'use strict'

//https://www.npmjs.com/package/heap
let Heap = require('heap');

/*
 * Node class used by the min heap
 * stores the log entry and which log source the entry came from
 */
class Node {
  constructor(log, logSourceIndex) {
    this.log = log;
    this.logSourceIndex = logSourceIndex;
  }
}

/*
 * compare function used by the min heap to compare Nodes
 * Nodes are compared using their log entry's date
 */
function compare(n1, n2) {
  if (n1.log.date < n2.log.date) {
    return -1;
  }
  if (n1.log.date > n2.log.date) {
    return 1;
  }
  return 0;
}


 /*
 * Time efficiency: O(m + n)
 * Space effieciency: O(m)
 * 
 * where m = the number of log sources
 * and n = the number of log entries
 *
 * A min heap is used to take advantage of the fact that
 * the root of the min heap is the smallest element in the heap.
 * 
 * The initial heap is built by popping all of the log sources
 * and using those log entries to build the heap.
 *
 * Once the heap is built it's size is m (number of log sources).
 * And we know that the root is the earliest log entry.
 * So we can pop the root of the heap and print the log.
 *
 * The next log to print can some from 2 places:
 *
 * 1) the log source we just printed from
 * 2) the root of the min heap
 *
 * These assumptions are made because the log sources are sorted
 * and the properties of a min heap.
 *
 * We pop the the next log entry and have 2 options:
 *
 * 1) Add the next log entry to the heap. The earliest log will
 *    bubbe up to the top. Pop the heap and print the log.
 *
 * 2) The log source is drained and we print the root of the heap.
 *
 * The size of the heap is at most O(m).
 *
 * The runtime is O(m + n), O(m) time to build the initial heap
 * and O(n) time to print each log entry.
 */
module.exports = (logSources, printer) => {
  // let heap = new Heap(compare);
  let heap;
  let promises = [];
  let heapNode, currentLogSource, heapRoot;

  /*callback for when promises returned by popAsync resolve*/
  function process(result) {
    heap.then(minHeap => {
      if (minHeap.size()) {
        heapRoot = minHeap.peek();

        //the log source is drained
        if (result === false) {
          heapNode = minHeap.pop();
          currentLogSource = heapNode.logSourceIndex;
          printer.print(heapNode.log);
        } else {
          minHeap.push(new Node(result, currentLogSource));
          heapNode = minHeap.pop();
          currentLogSource = heapNode.logSourceIndex;
          printer.print(heapNode.log);
        }

        logSources[currentLogSource].popAsync().then(process);

      } else {
        printer.done();
      }
    })
  }

  //Pop the earliest log entries (Promises) from each log source
  //Push each promise into an array
  for (let i = 0; i < logSources.length; i++) {
    promises.push(logSources[i].popAsync());
  }

  let logEntries = Promise.all(promises);

  //Once all of the promises have resolved build the min heap
  heap = logEntries.then(entries => {
    let minHeap = new Heap(compare);

    for (let i = 0; i < entries.length; i++) {
      minHeap.push(new Node(entries[i], i));
    }

    return new Promise((resolve, reject) => {
      if (minHeap.size() === logSources.length) {
        resolve(minHeap);
      } else {
        reject(new Error('heap not valid'));
      }
    });
  });

  heap.then(minHeap => {
    heapNode = minHeap.pop();
    currentLogSource = heapNode.logSourceIndex;

    printer.print(heapNode.log);

    logSources[currentLogSource].popAsync().then(process);
  });
}