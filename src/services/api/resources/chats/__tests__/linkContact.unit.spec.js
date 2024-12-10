import { vi, describe, it, expect } from 'vitest';
import linkContact from '../linkContact';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

describe('Link Contact Service', () => {
  const uuid = getProject();

  describe('getLinketContact', () => {
    it('should make a GET request to /project/{uuid}/retrieve_linked_contact/ with correct params', async () => {
      const mockResponse = { data: { linkedContact: true } };
      http.get.mockResolvedValue(mockResponse);

      const contact = { id: 'contact-id' };

      const result = await linkContact.getLinketContact(contact);

      expect(http.get).toHaveBeenCalledWith(
        `/project/${uuid}/retrieve_linked_contact/`,
        {
          params: contact,
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('linkContactToAgent', () => {
    it('should make a POST request to /project/{uuid}/create_linked_contact/ with correct contact data', async () => {
      const mockResponse = { data: { success: true } };
      http.post.mockResolvedValue(mockResponse);

      const contact = { id: 'contact-id' };

      const result = await linkContact.linkContactToAgent(contact);

      expect(http.post).toHaveBeenCalledWith(
        `/project/${uuid}/create_linked_contact/`,
        contact,
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('removeContactFromAgent', () => {
    it('should make a DELETE request to /project/{uuid}/delete_linked_contact with correct params', async () => {
      const mockResponse = { data: { success: true } };
      http.delete.mockResolvedValue(mockResponse);

      const contact = { id: 'contact-id' };

      const result = await linkContact.removeContactFromAgent(contact);

      expect(http.delete).toHaveBeenCalledWith(
        `/project/${uuid}/delete_linked_contact`,
        {
          params: { contact },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  it('should handle error on GET request in getLinketContact', async () => {
    const mockError = { response: { status: 404, data: 'Not Found' } };
    http.get.mockRejectedValue(mockError);

    const contact = { id: 'contact-id' };

    linkContact.getLinketContact(contact).catch((err) => {
      expect(err.response).toEqual(mockError.response);
    });
  });

  it('should handle error on POST request in linkContactToAgent', async () => {
    const mockError = { response: { status: 400, data: 'Bad Request' } };
    http.post.mockRejectedValue(mockError);

    const contact = { id: 'contact-id' };

    linkContact.linkContactToAgent(contact).catch((err) => {
      expect(err.response).toEqual(mockError.response);
    });
  });

  it('should handle error on DELETE request in removeContactFromAgent', async () => {
    const mockError = { response: { status: 500, data: 'Server Error' } };
    http.delete.mockRejectedValue(mockError);

    const contact = { id: 'contact-id' };

    linkContact.removeContactFromAgent(contact).catch((err) => {
      expect(err.response).toEqual(mockError.response);
    });
  });
});
