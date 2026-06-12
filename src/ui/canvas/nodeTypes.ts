import type { NodeTypes } from 'reactflow';
import { OBJECT_NODE_TYPE, MACHINE_NODE_TYPE } from '../../flow/adapter';
import { ObjectTerminalNode } from './nodes/ObjectTerminalNode';
import { MachineNode } from './nodes/MachineNode';
import { SAMPLE_TOKEN_TYPE, SampleTokenNode } from './nodes/SampleTokenNode';

/** Stable reference so React Flow does not re-register node types each render. */
export const nodeTypes: NodeTypes = {
  [OBJECT_NODE_TYPE]: ObjectTerminalNode,
  [MACHINE_NODE_TYPE]: MachineNode,
  [SAMPLE_TOKEN_TYPE]: SampleTokenNode,
};
