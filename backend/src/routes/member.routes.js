import { Router } from 'express';
import * as memberController from '../controllers/member.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { inviteMemberSchema, updateMemberSchema } from '../validators/member.validator.js';

const router = Router({ mergeParams: true });

router.get('/', memberController.listMembers);
router.post('/', validate(inviteMemberSchema), memberController.inviteMember);
router.patch('/:userId', validate(updateMemberSchema), memberController.updateMember);
router.delete('/:userId', memberController.removeMember);

export default router;
