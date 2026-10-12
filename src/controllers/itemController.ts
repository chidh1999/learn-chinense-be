import type { Request, Response } from 'express';
import * as itemService from '../services/itemService.js';
import {
  createItemSchema,
  updateItemSchema,
  listItemsQuerySchema,
  objectIdSchema,
} from '../validators/itemValidators.js';

export async function list(req: Request, res: Response) {
  const query = listItemsQuerySchema.parse(req.query);
  const result = await itemService.listItems(query);
  res.json({ success: true, data: result });
}

export async function create(req: Request, res: Response) {
  const body = createItemSchema.parse(req.body);
  const item = await itemService.createItem(body);
  res.status(201).json({ success: true, data: item });
}

export async function getOne(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const result = await itemService.getItem(id);
  res.json({ success: true, data: result });
}

export async function update(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const body = updateItemSchema.parse(req.body);
  const item = await itemService.updateItem(id, body);
  res.json({ success: true, data: item });
}

export async function remove(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const result = await itemService.deleteItem(id);
  res.json({ success: true, data: result });
}
