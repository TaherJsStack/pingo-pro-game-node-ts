import { Subject, Observable } from 'rxjs';

class InvoiceService {
  private dataSubject: Subject<any>;

  constructor() {
    this.dataSubject = new Subject();
  }

  setData(data: any): void {
    this.dataSubject.next(data);
  }

  getDataObservable(): Observable<any> {
    return this.dataSubject.asObservable();
  }
}

export default new InvoiceService();