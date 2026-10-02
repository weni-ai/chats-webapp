import Group from '@/services/api/resources/settings/group';
import Sector from '@/services/api/resources/settings/sector';

const PAGE_SIZE = 50;

type PaginatedResponse<T> = {
  results?: T[];
  next?: string | null;
};

type SecondaryProject = {
  uuid?: string;
};

type SectorItem = {
  uuid?: string;
};

async function listAllPages<T>(
  fetchPage: (_offset: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { results = [], next } = await fetchPage(offset);
    items.push(...results);
    hasMore = !!next;
    offset += PAGE_SIZE;
  }

  return items;
}

export async function listSecondarySectorOrigins(
  orgUuid: string,
): Promise<Record<string, string>> {
  const projects = await listAllPages<SecondaryProject>((offset) =>
    Group.listProjects({
      orgUuid,
      limit: PAGE_SIZE,
      offset,
      params: { its_principal: false },
    }),
  );

  const origins: Record<string, string> = {};

  await Promise.all(
    projects.map(async (project) => {
      const projectUuid = project.uuid?.trim();
      if (!projectUuid) {
        return;
      }

      const sectors = await listAllPages<SectorItem>((offset) =>
        Sector.list({
          project: projectUuid,
          limit: PAGE_SIZE,
          offset,
        }),
      );

      sectors.forEach((sector) => {
        const sectorUuid = sector.uuid?.trim();
        if (sectorUuid) {
          origins[sectorUuid] = projectUuid;
        }
      });
    }),
  );

  return origins;
}
