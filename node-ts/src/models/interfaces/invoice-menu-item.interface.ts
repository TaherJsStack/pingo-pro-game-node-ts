export interface IInvoiceMenuItem {
  itemId: import('./common.interface').ObjectId;
  itemName: string;
  quantity: number;
  price: number;
}
