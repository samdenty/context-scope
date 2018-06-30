import Context from '.'

interface User {
  name: string
  surname: string
  email: string
}

const user = new Context<User>()

const fullName = () => `${user.value.name} ${user.value.surname}`
const link = () => `mailto:${user.value.email}`
const title = () => `${fullName()} [${user.value.email}]`

const getHTML = () => `<a href="${link()}" title="${title()}">${fullName()}</a>`

user.scope(scope => {
  scope.set({
    name: 'Rick',
    surname: 'Astley',
    email: 'hello@example.com'
  })

  const link = getHTML()

  console.log(link)
})

console.log(user.getScope(0))
