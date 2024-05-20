const { Subject } = require('rxjs');

class InvoiceService {
  constructor() {
    this.dataSubject = new Subject();
  }

  setData(data) {
    //console.log('setData', data);
    this.dataSubject.next(data);
  }

  getDataObservable() {
    return this.dataSubject.asObservable();
  }
}

module.exports = new InvoiceService();
