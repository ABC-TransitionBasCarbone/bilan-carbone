// SCRIPT A RELIRE

import { prismaClient } from '@/db/client'
import { getOrganizationVersionById } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { Command } from 'commander'
import * as readline from 'readline'

const program = new Command()

program
  .name('move-studies-of-organization')
  .description('Script to switch study from one orga to another')
  .version('1.0.0')
  .requiredOption('--oldOrga, --old-orga-version-id <value>', 'old organization link to the study')
  .requiredOption('--newOrga, --new-orga-version-id <value>', 'new organization link to the study')
  .requiredOption('-s, --study-id <value>', 'Id of the study')
  .option(
    '--studyOrga, --new-organization-version-id-for-study <value>',
    'id of the new organization for the study if new orga version is CR',
  )
  .parse(process.argv)

const params = program.opts()

const checkOnstudyAndOrgaBeforeSwitch = async () => {
  const { oldOrgaVersionId, newOrgaVersionId, studyId, newOrganizationVersionIdForStudy } = params

  const oldOrgaVersion = await getOrganizationVersionById(oldOrgaVersionId)
  const newOrgaVersion = await getOrganizationVersionById(newOrgaVersionId)
  const study = await getStudyById(studyId, newOrgaVersionId)

  if (!oldOrgaVersion || !newOrgaVersion || !study) {
    console.log('❌ One of the organization does not exist.')
    return { error: true, data: null }
  }

  if (study.organizationVersionId !== oldOrgaVersionId) {
    console.log('❌ The study is not linked to the old organization.')
    return { error: true, data: null }
  }

  if (newOrgaVersion.isCR && !newOrganizationVersionIdForStudy) {
    console.log('❌ The new organization is a CR orga. Please provide the id of the new organization for the study.')
    return { error: true, data: null }
  }

  let newOrganizationVersionForStudy
  let newOrganizationForStudyName
  if (newOrgaVersion.isCR) {
    newOrganizationVersionForStudy = await getOrganizationVersionById(newOrganizationVersionIdForStudy)

    if (!newOrganizationVersionForStudy) {
      console.log('❌ The new organization version for the study does not exist.')
      return { error: true, data: null }
    }

    newOrganizationForStudyName = newOrganizationVersionForStudy.organization.name
  } else {
    newOrganizationVersionForStudy = newOrgaVersion
    newOrganizationForStudyName = newOrgaVersion.organization.name
  }

  const usersFromNewOrga = study.allowedUsers.filter((user) => user.account.organizationVersionId === newOrgaVersionId)
  if (usersFromNewOrga.length === 0) {
    console.log('❌ No user from the new orga have access to the study. Please add at least one user.')
    return { error: true, data: null }
  }

  if (!usersFromNewOrga.some((user) => !!user.account.user.level)) {
    console.log('❌ No user added to the study has a level of formation in the new orga. Please add at least one user.')
    return { error: true, data: null }
  }

  const studySites = study.sites.map((site) => site.site.name)
  const newOrgaSites = newOrganizationVersionForStudy.organization.sites.map((site) => site.name)
  const missingSites = studySites.filter((site) => !newOrgaSites.includes(site))

  if (missingSites.length > 0) {
    console.log(
      `❌ The new organization does not have the same sites as the study. Missing sites: ${missingSites.join(', ')}`,
    )
    return { error: true, data: null }
  }

  return {
    error: false,
    data: {
      oldOrgaVersion,
      newOrganizationVersionForStudy,
      study,
      newOrgaVersion,
      newOrganizationForStudyName,
    },
  }
}

const switchStudiesOfOrganization = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const userConfirmation = await new Promise((resolve) => {
    rl.question('Do you have the authorization from the orga that own the study ? y(es)/n(o) ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })

  if (!userConfirmation) {
    console.log('❌ switch cancelled.')
    return
  }

  const { error, data } = await checkOnstudyAndOrgaBeforeSwitch()
  if (error || !data) {
    return
  }

  await prismaClient.$transaction(
    async (transaction) => {
      const { oldOrgaVersion, newOrganizationVersionForStudy, study, newOrgaVersion, newOrganizationForStudyName } =
        data

      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
      const userConfirmationOfOrgas = await new Promise((resolve) => {
        rl2.question(
          `You do want to move the study from orga ${oldOrgaVersion.organization.name} to ${newOrgaVersion.organization.name} ${
            newOrgaVersion.isCR
              ? `, CR orga, the study will be put to this orga:
            ${newOrganizationForStudyName} included in the CR orga`
              : ''
          } y(es)/n(o) ? `,
          (answer) => {
            rl2.close()
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
          },
        )
      })

      if (!userConfirmationOfOrgas) {
        console.log('❌ switch cancelled.')
        return
      }

      await transaction.study.update({
        where: { id: study.id },
        data: { organizationVersionId: newOrganizationVersionForStudy.id },
      })

      await Promise.all(
        study.sites.map((studySite) => {
          const newSite = newOrganizationVersionForStudy.organization.sites.find(
            (site) => site.name === studySite.site.name,
          )

          if (!newSite) {
            console.log(`❌ Site ${studySite.site.name} not found in the new organization.`)
            return Promise.resolve()
          }

          return transaction.studySite.update({
            where: { id: studySite.id },
            data: { siteId: newSite.id },
          })
        }),
      )

      console.log(`✅ Study moved to the new organization: ${newOrganizationForStudyName}`)
    },
    { timeout: 10000 },
  )
}

switchStudiesOfOrganization()
