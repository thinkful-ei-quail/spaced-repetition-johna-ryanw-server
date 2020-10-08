class _Node {
  constructor(data, next = null) {
    (this.data = data), (this.next = next);
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  insertFirst(item) {
    if (!item) {
      return 'No data to insert.';
    }
    this.head = new _Node(item, this.head);
  }

  insertLast(item) {
    if (!item) {
      return 'No data to insert';
    }
    if (this.head === null) {
      this.insertFirst(item);
    } else {
      let tempNode = this.head;
      while (tempNode.next !== null) {
        tempNode = tempNode.next;
      }
      tempNode.next = new _Node(item, null);
    }
  }

  insertAt(nthPos, itemToInsert) {
    if (!itemToInsert) {
      return 'No data to insert.';
    }
    if (nthPos < 0) {
      throw Error('Position error.');
    }
    if (nthPos === 0 || !this.head) {
      this.insertFirst(itemToInsert);
    } else {
      const node = this._findNthElement(nthPos - 1);
      const newNode = new _Node(itemToInsert, null);
      newNode.next = node.next;
      node.next = newNode;
    }
  }

  _findNthElement(pos) {
    let node = this.head;
    for (let i = 0; i < pos; i++) {
      if (!node.next) {
        return node;
      } else {
        node = node.next;
      }
    }
    return node;
  }

  remove(item) {
    if (!this.head) {
      return null;
    }
    if (this.head.data === item) {
      this.head = this.head.next;
      return;
    }
    let currNode = this.head;
    let prevNode = this.head;
    while (currNode !== null && currNode.data !== item) {
      prevNode = currNode;
      currNode = currNode.next;
    }
    if (currNode === null) {
      throw Error('Item not found.');
    }
    prevNode.next = currNode.next;
  }

  find(item) {
    if (!this.head) {
      return null;
    }
    let currNode = this.head;
    while (currNode.data !== item) {
      if (currNode.next === null) {
        return null;
      } else {
        currNode = currNode.next;
      }
    }
    return currNode;
  }
}

module.exports = LinkedList;
