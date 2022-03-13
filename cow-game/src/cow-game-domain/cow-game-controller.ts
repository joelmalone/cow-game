import { createAsyncMessageBus } from '../reusable/async-message-bus';
import {
  ChangeEvent,
  createCommandEventModelController,
} from '../reusable/command-event-model-controller';
import type { Command } from './cow-game-commands';
import type { Events } from './cow-game-events';
import type { IModel } from './cow-game-model';
import { reduce } from './cow-game-reduce';

export type GameController = ReturnType<typeof createGameController>;

export function createGameController() {
  function onModelChanged(ev: {
    event: Events;
    version: number;
    model: IModel;
  }) {
    asyncEventQueue.enqueueMessage(ev);
  }

  const asyncEventQueue = createAsyncMessageBus<ChangeEvent<IModel, Events>>();

  const controller = createCommandEventModelController<IModel, Events, Command>(
    {} as IModel,
    (model, command, emitEvent) => command(model, emitEvent),
    reduce,
    onModelChanged,
  );

  return {
    enqueueCommand: controller.enqueueCommand,
    subscribeEvents: asyncEventQueue.subscribeAsyncListener,
  };
}
