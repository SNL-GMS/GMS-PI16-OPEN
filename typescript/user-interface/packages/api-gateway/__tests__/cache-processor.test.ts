import { CacheProcessor } from '../src/ts/cache/cache-processor';

describe('Workspace State Test', () => {
  test('Adding event to users to workspace state', () => {
    let workspaceState = CacheProcessor.Instance().getWorkspaceState();
    expect(workspaceState).toBeDefined();
    expect(workspaceState).toMatchSnapshot();

    CacheProcessor.Instance().addOrUpdateEventToUser('test', 'user1');
    workspaceState = CacheProcessor.Instance().getWorkspaceState();
    expect(workspaceState).toBeDefined();
    expect(workspaceState).toMatchSnapshot();

    CacheProcessor.Instance().removeUserFromEvent('test', 'user1');
    workspaceState = CacheProcessor.Instance().getWorkspaceState();
    expect(workspaceState).toBeDefined();
    expect(workspaceState).toMatchSnapshot();
  });
});
