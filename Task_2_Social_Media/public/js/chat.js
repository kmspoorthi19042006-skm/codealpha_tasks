/* =========================================================
   VIBE — REAL-TIME CHAT
========================================================= */

let currentUser = null;
let activeChatUser = null;
let recentConversations = [];

let socket = null;

let searchTimeout = null;
let newChatSearchTimeout = null;
let typingTimeout = null;

let isSending = false;

let messageToDelete = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const chatElements = {

    currentUserAvatar:
        document.getElementById("currentUserAvatar"),

    currentUserInitials:
        document.getElementById("currentUserInitials"),

    newChatBtn:
        document.getElementById("newChatBtn"),

    startChatBtn:
        document.getElementById("startChatBtn"),

    userSearchInput:
        document.getElementById("userSearchInput"),

    searchResults:
        document.getElementById("searchResults"),

    conversationList:
        document.getElementById("conversationList"),

    chatWelcome:
        document.getElementById("chatWelcome"),

    activeChat:
        document.getElementById("activeChat"),

    activeUserAvatar:
        document.getElementById("activeUserAvatar"),

    activeUserInitials:
        document.getElementById("activeUserInitials"),

    activeUserName:
        document.getElementById("activeUserName"),

    activeUserUsername:
        document.getElementById("activeUserUsername"),

    viewProfileBtn:
        document.getElementById("viewProfileBtn"),

    deleteChatBtn:
        document.getElementById("deleteChatBtn"),

    messagesContainer:
        document.getElementById("messagesContainer"),

    messagesLoading:
        document.getElementById("messagesLoading"),

    typingIndicator:
        document.getElementById("typingIndicator"),

    messageForm:
        document.getElementById("messageForm"),

    messageInput:
        document.getElementById("messageInput"),

    sendMessageBtn:
        document.getElementById("sendMessageBtn"),

    emojiBtn:
        document.getElementById("emojiBtn"),

    newChatModal:
        document.getElementById("newChatModal"),

    closeNewChatBtn:
        document.getElementById("closeNewChatBtn"),

    newChatSearchInput:
        document.getElementById("newChatSearchInput"),

    newChatResults:
        document.getElementById("newChatResults"),

    deleteChatModal:
        document.getElementById("deleteChatModal"),

    cancelDeleteChatBtn:
        document.getElementById("cancelDeleteChatBtn"),

    confirmDeleteChatBtn:
        document.getElementById("confirmDeleteChatBtn"),

    deleteMessageModal:
        document.getElementById("deleteMessageModal"),

    cancelDeleteMessageBtn:
        document.getElementById("cancelDeleteMessageBtn"),

    confirmDeleteMessageBtn:
        document.getElementById("confirmDeleteMessageBtn")

};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeChat
);


async function initializeChat() {

    if (!requireAuth()) {
        return;
    }

    setupEvents();

    try {

        await loadCurrentUser();

        loadRecentConversations();

        renderRecentConversations();

        connectSocket();

    } catch (error) {

        console.error(
            "Chat initialization error:",
            error
        );

        showToast(
            error.message ||
            "Unable to initialize chat.",
            "error"
        );

    }

}


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    const response =
        await getCurrentUser();

    currentUser =
        response.user ||
        response.data ||
        response;

    if (!currentUser) {

        throw new Error(
            "Unable to identify current user."
        );

    }

    renderCurrentUser();

}


function renderCurrentUser() {

    const name =
        currentUser.name ||
        currentUser.username ||
        "User";


    if (
        chatElements.currentUserAvatar
    ) {

        if (currentUser.profile_image) {

            chatElements.currentUserAvatar.innerHTML = `
                <img
                    src="${escapeHTML(
                        currentUser.profile_image
                    )}"
                    alt="${escapeHTML(name)}"
                >
            `;

        } else {

            chatElements.currentUserAvatar.innerHTML = `
                <span id="currentUserInitials">
                    ${escapeHTML(
                        getInitials(name)
                    )}
                </span>
            `;

        }

    }


    if (
        chatElements.currentUserAvatar
    ) {

        chatElements.currentUserAvatar.onclick =
            () => {

                window.location.href =
                    `/profile.html?id=${currentUser.id}`;

            };

    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* Sidebar search */

    if (chatElements.userSearchInput) {

        chatElements.userSearchInput.addEventListener(
            "input",
            handleSidebarSearch
        );

    }


    /* New conversation */

    if (chatElements.newChatBtn) {

        chatElements.newChatBtn.addEventListener(
            "click",
            openNewChatModal
        );

    }


    if (chatElements.startChatBtn) {

        chatElements.startChatBtn.addEventListener(
            "click",
            openNewChatModal
        );

    }


    /* Close new chat modal */

    if (chatElements.closeNewChatBtn) {

        chatElements.closeNewChatBtn.addEventListener(
            "click",
            closeNewChatModal
        );

    }


    /* New chat search */

    if (chatElements.newChatSearchInput) {

        chatElements.newChatSearchInput.addEventListener(
            "input",
            handleNewChatSearch
        );

    }


    /* New chat backdrop */

    if (chatElements.newChatModal) {

        chatElements.newChatModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    chatElements.newChatModal
                ) {

                    closeNewChatModal();

                }

            }
        );

    }


    /* Message form */

    if (chatElements.messageForm) {

        chatElements.messageForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendCurrentMessage();

            }
        );

    }


    /* Message input */

    if (chatElements.messageInput) {

        chatElements.messageInput.addEventListener(
            "keydown",
            handleMessageKeydown
        );

        chatElements.messageInput.addEventListener(
            "input",
            handleMessageTyping
        );

    }


    /* Emoji */

    if (chatElements.emojiBtn) {

        chatElements.emojiBtn.addEventListener(
            "click",
            insertEmoji
        );

    }


    /* View profile */

    if (chatElements.viewProfileBtn) {

        chatElements.viewProfileBtn.addEventListener(
            "click",
            () => {

                if (!activeChatUser) {
                    return;
                }

                window.location.href =
                    `/profile.html?id=${activeChatUser.id}`;

            }
        );

    }


    /* Delete whole chat */

    if (chatElements.deleteChatBtn) {

        chatElements.deleteChatBtn.addEventListener(
            "click",
            openDeleteChatModal
        );

    }


    /* Delete chat confirmation */

    if (chatElements.cancelDeleteChatBtn) {

        chatElements.cancelDeleteChatBtn.addEventListener(
            "click",
            closeDeleteChatModal
        );

    }


    if (chatElements.confirmDeleteChatBtn) {

        chatElements.confirmDeleteChatBtn.addEventListener(
            "click",
            deleteEntireConversation
        );

    }


    /* Delete message confirmation */

    if (chatElements.cancelDeleteMessageBtn) {

        chatElements.cancelDeleteMessageBtn.addEventListener(
            "click",
            closeDeleteMessageModal
        );

    }


    if (chatElements.confirmDeleteMessageBtn) {

        chatElements.confirmDeleteMessageBtn.addEventListener(
            "click",
            deleteSelectedMessage
        );

    }


    /* Delete modal backdrop */

    if (chatElements.deleteChatModal) {

        chatElements.deleteChatModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    chatElements.deleteChatModal
                ) {

                    closeDeleteChatModal();

                }

            }
        );

    }


    if (chatElements.deleteMessageModal) {

        chatElements.deleteMessageModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    chatElements.deleteMessageModal
                ) {

                    closeDeleteMessageModal();

                }

            }
        );

    }


    /* Escape key */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            closeNewChatModal();
            closeDeleteChatModal();
            closeDeleteMessageModal();

            closeAllMessageMenus();

        }
    );

}


/* =========================================================
   SOCKET.IO
========================================================= */

function connectSocket() {

    if (
        typeof io !== "function"
    ) {

        console.warn(
            "Socket.IO client is not available."
        );

        return;

    }


    const token =
        localStorage.getItem(
            "social_token"
        );


    if (!token) {
        return;
    }


    socket = io({

        auth: {
            token
        },

        transports: [
            "websocket",
            "polling"
        ]

    });


    socket.on(
        "connect",
        () => {

            console.log(
                "🟢 Vibe real-time chat connected"
            );

        }
    );


    socket.on(
        "socket_connected",
        data => {

            console.log(
                "Socket authenticated:",
                data
            );

        }
    );


    socket.on(
        "connect_error",
        error => {

            console.error(
                "Socket connection error:",
                error.message
            );

        }
    );


    socket.on(
        "receive_message",
        message => {

            handleIncomingMessage(
                message
            );

        }
    );


    socket.on(
        "user_typing",
        data => {

            if (!activeChatUser) {
                return;
            }


            if (
                Number(data.user_id) !==
                Number(activeChatUser.id)
            ) {

                return;

            }


            setTypingIndicator(
                Boolean(data.is_typing)
            );

        }
    );


    socket.on(
        "disconnect",
        reason => {

            console.log(
                "🔴 Vibe chat disconnected:",
                reason
            );

        }
    );

}


/* =========================================================
   INCOMING MESSAGE
========================================================= */

function handleIncomingMessage(message) {

    if (!message) {
        return;
    }


    const senderId =
        Number(message.sender_id);


    /* Current open chat */

    if (
        activeChatUser &&
        senderId ===
        Number(activeChatUser.id)
    ) {

        appendMessage({
            ...message,
            is_mine: false
        });

        scrollMessagesToBottom();

        setTypingIndicator(false);

    }


    /*
     * Use active user information where possible.
     * This avoids the old generic "User" label.
     */

    let sender = null;


    if (
        activeChatUser &&
        Number(activeChatUser.id) === senderId
    ) {

        sender = {
            ...activeChatUser
        };

    }


    if (!sender) {

        const existingConversation =
            recentConversations.find(
                conversation =>
                    Number(conversation.id) === senderId
            );

        if (existingConversation) {

            sender = {
                ...existingConversation
            };

        }

    }


    if (!sender) {

        sender = {

            id: senderId,

            name: "User",

            username: "",

            profile_image: null

        };

    }


    addOrUpdateConversation({

        ...sender,

        last_message:
            message.content || "",

        updated_at:
            message.created_at ||
            new Date().toISOString()

    });

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendCurrentMessage() {

    if (isSending) {
        return;
    }


    if (!activeChatUser) {

        showToast(
            "Select a conversation first.",
            "error"
        );

        return;

    }


    const input =
        chatElements.messageInput;


    if (!input) {
        return;
    }


    const content =
        input.value.trim();


    if (!content) {
        return;
    }


    if (content.length > 2000) {

        showToast(
            "Message cannot exceed 2000 characters.",
            "error"
        );

        return;

    }


    isSending = true;

    setComposerLoading(true);


    try {

        const response =
            await apiRequest(
                `/chat/${activeChatUser.id}`,
                {

                    method: "POST",

                    body:
                        JSON.stringify({
                            content
                        })

                }
            );


        const message =
            response.message ||
            response.data;


        if (!message) {

            throw new Error(
                "Message was not created."
            );

        }


        appendMessage({

            ...message,

            is_mine: true

        });


        if (
            socket &&
            socket.connected
        ) {

            socket.emit(
                "send_message",
                {

                    receiver_id:
                        Number(
                            activeChatUser.id
                        ),

                    message

                }
            );

        }


        input.value = "";

        autoResizeMessageInput();

        scrollMessagesToBottom();


        addOrUpdateConversation({

            ...activeChatUser,

            last_message:
                content,

            updated_at:
                message.created_at ||
                new Date().toISOString()

        });


        setTypingIndicator(false);


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        showToast(
            error.message ||
            "Unable to send message.",
            "error"
        );

    } finally {

        isSending = false;

        setComposerLoading(false);

    }

}


/* =========================================================
   APPEND MESSAGE
========================================================= */

function appendMessage(message) {

    if (
        !chatElements.messagesContainer
    ) {
        return;
    }


    const emptyState =
        chatElements.messagesContainer.querySelector(
            ".chat-empty-state"
        );


    if (emptyState) {
        emptyState.remove();
    }


    const messageElement =
        createMessageElement(
            message
        );


    chatElements.messagesContainer.appendChild(
        messageElement
    );

}


/* =========================================================
   CREATE MESSAGE ELEMENT
========================================================= */

function createMessageElement(message) {

    const wrapper =
        document.createElement("div");


    const messageId =
        Number(message.id || 0);


    const isMine =
        Boolean(
            message.is_mine ||
            Number(message.sender_id) ===
            Number(currentUser?.id)
        );


    wrapper.className =
        `message-row ${
            isMine
                ? "message-mine"
                : "message-theirs"
        }`;


    if (messageId) {

        wrapper.dataset.messageId =
            messageId;

    }


    const bubble =
        document.createElement("div");


    bubble.className =
        "message-bubble";


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    content.innerHTML =
        escapeHTML(
            message.content || ""
        ).replace(
            /\n/g,
            "<br>"
        );


    const footer =
        document.createElement("div");


    footer.className =
        "message-footer";


    const time =
        document.createElement("div");


    time.className =
        "message-time";


    time.textContent =
        formatMessageTime(
            message.created_at
        );


    footer.appendChild(time);


    /*
     * Delete menu is shown only for
     * messages sent by the current user.
     */

    if (
        isMine &&
        messageId
    ) {

        const menuWrapper =
            document.createElement("div");


        menuWrapper.className =
            "message-menu-wrapper";


        const menuButton =
            document.createElement("button");


        menuButton.type =
            "button";


        menuButton.className =
            "message-menu-btn";


        menuButton.title =
            "Message options";


        menuButton.setAttribute(
            "aria-label",
            "Message options"
        );


        menuButton.innerHTML =
            `<i class="fa-solid fa-ellipsis"></i>`;


        const menu =
            document.createElement("div");


        menu.className =
            "message-menu hidden";


        const deleteButton =
            document.createElement("button");


        deleteButton.type =
            "button";


        deleteButton.className =
            "message-delete-btn";


        deleteButton.innerHTML = `
            <i class="fa-regular fa-trash-can"></i>
            Delete
        `;


        menuButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleMessageMenu(
                    menu
                );

            }
        );


        deleteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                closeAllMessageMenus();

                openDeleteMessageModal(
                    messageId,
                    wrapper
                );

            }
        );


        menu.appendChild(
            deleteButton
        );


        menuWrapper.appendChild(
            menuButton
        );


        menuWrapper.appendChild(
            menu
        );


        footer.appendChild(
            menuWrapper
        );

    }


    bubble.appendChild(
        content
    );


    bubble.appendChild(
        footer
    );


    wrapper.appendChild(
        bubble
    );


    return wrapper;

}


/* =========================================================
   MESSAGE MENU
========================================================= */

function toggleMessageMenu(menu) {

    const wasHidden =
        menu.classList.contains(
            "hidden"
        );


    closeAllMessageMenus();


    if (wasHidden) {

        menu.classList.remove(
            "hidden"
        );

    }

}


function closeAllMessageMenus() {

    document
        .querySelectorAll(
            ".message-menu"
        )
        .forEach(
            menu => {

                menu.classList.add(
                    "hidden"
                );

            }
        );

}


document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".message-menu-wrapper"
            )
        ) {

            closeAllMessageMenus();

        }

    }
);


/* =========================================================
   DELETE MESSAGE MODAL
========================================================= */

function openDeleteMessageModal(
    messageId,
    messageElement
) {

    messageToDelete = {

        id:
            Number(messageId),

        element:
            messageElement

    };


    if (
        chatElements.deleteMessageModal
    ) {

        chatElements.deleteMessageModal.hidden =
            false;

        chatElements.deleteMessageModal.classList.remove(
            "hidden"
        );

    }

}


function closeDeleteMessageModal() {

    if (
        chatElements.deleteMessageModal
    ) {

        chatElements.deleteMessageModal.hidden =
            true;

        chatElements.deleteMessageModal.classList.add(
            "hidden"
        );

    }


    messageToDelete = null;

}


/* =========================================================
   DELETE SELECTED MESSAGE
========================================================= */

async function deleteSelectedMessage() {

    if (!messageToDelete) {
        return;
    }


    const messageId =
        Number(
            messageToDelete.id
        );


    if (!messageId) {
        return;
    }


    if (
        chatElements.confirmDeleteMessageBtn
    ) {

        chatElements.confirmDeleteMessageBtn.disabled =
            true;

        chatElements.confirmDeleteMessageBtn.innerHTML = `
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            Deleting...
        `;

    }


    try {

        await apiRequest(
            `/chat/message/${messageId}`,
            {
                method: "DELETE"
            }
        );


        if (
            messageToDelete.element
        ) {

            messageToDelete.element.remove();

        }


        /*
         * If no messages remain,
         * show the empty state again.
         */

        const remainingMessages =
            chatElements.messagesContainer
                ?.querySelectorAll(
                    ".message-row"
                );


        if (
            !remainingMessages ||
            remainingMessages.length === 0
        ) {

            renderMessages([]);

        }


        updateActiveConversationPreviewAfterMessageDelete();


        showToast(
            "Message deleted.",
            "success"
        );


        closeDeleteMessageModal();


    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete message.",
            "error"
        );

    } finally {

        if (
            chatElements.confirmDeleteMessageBtn
        ) {

            chatElements.confirmDeleteMessageBtn.disabled =
                false;

            chatElements.confirmDeleteMessageBtn.innerHTML = `
                <i class="fa-regular fa-trash-can"></i>
                Delete message
            `;

        }

    }

}


/* =========================================================
   DELETE WHOLE CHAT
========================================================= */

function openDeleteChatModal() {

    if (!activeChatUser) {

        showToast(
            "Select a conversation first.",
            "error"
        );

        return;

    }


    const name =
        activeChatUser.name ||
        activeChatUser.username ||
        "this user";


    const description =
        document.getElementById(
            "deleteChatDescription"
        );


    if (description) {

        description.textContent =
            `This will permanently delete your conversation with ${name}.`;

    }


    if (
        chatElements.deleteChatModal
    ) {

        chatElements.deleteChatModal.hidden =
            false;

        chatElements.deleteChatModal.classList.remove(
            "hidden"
        );

    }

}


function closeDeleteChatModal() {

    if (
        chatElements.deleteChatModal
    ) {

        chatElements.deleteChatModal.hidden =
            true;

        chatElements.deleteChatModal.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   DELETE ENTIRE CONVERSATION
========================================================= */

async function deleteEntireConversation() {

    if (!activeChatUser) {
        return;
    }


    const userId =
        Number(
            activeChatUser.id
        );


    if (!userId) {
        return;
    }


    if (
        chatElements.confirmDeleteChatBtn
    ) {

        chatElements.confirmDeleteChatBtn.disabled =
            true;

        chatElements.confirmDeleteChatBtn.innerHTML = `
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            Deleting...
        `;

    }


    try {

        await apiRequest(
            `/chat/${userId}`,
            {
                method: "DELETE"
            }
        );


        /*
         * Remove conversation from
         * local sidebar storage.
         */

        recentConversations =
            recentConversations.filter(
                conversation =>
                    Number(conversation.id) !==
                    userId
            );


        saveRecentConversations();


        activeChatUser = null;


        clearTypingState();


        renderRecentConversations();


        /*
         * Return to welcome screen.
         */

        if (
            chatElements.activeChat
        ) {

            chatElements.activeChat.classList.add(
                "hidden"
            );

        }


        if (
            chatElements.chatWelcome
        ) {

            chatElements.chatWelcome.classList.remove(
                "hidden"
            );

        }


        if (
            chatElements.messagesContainer
        ) {

            chatElements.messagesContainer.innerHTML =
                "";

        }


        showToast(
            "Conversation deleted.",
            "success"
        );


        closeDeleteChatModal();


    } catch (error) {

        console.error(
            "Delete conversation error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete conversation.",
            "error"
        );

    } finally {

        if (
            chatElements.confirmDeleteChatBtn
        ) {

            chatElements.confirmDeleteChatBtn.disabled =
                false;

            chatElements.confirmDeleteChatBtn.innerHTML = `
                <i class="fa-regular fa-trash-can"></i>
                Delete chat
            `;

        }

    }

}


/* =========================================================
   UPDATE SIDEBAR AFTER MESSAGE DELETE
========================================================= */

function updateActiveConversationPreviewAfterMessageDelete() {

    if (!activeChatUser) {
        return;
    }


    const conversation =
        recentConversations.find(
            item =>
                Number(item.id) ===
                Number(activeChatUser.id)
        );


    if (!conversation) {
        return;
    }


    const messages =
        chatElements.messagesContainer
            ?.querySelectorAll(
                ".message-row"
            );


    if (
        !messages ||
        messages.length === 0
    ) {

        conversation.last_message =
            "";

    } else {

        const lastMessage =
            messages[
                messages.length - 1
            ];


        const content =
            lastMessage.querySelector(
                ".message-content"
            );


        conversation.last_message =
            content
                ? content.textContent
                : "";

    }


    saveRecentConversations();

    renderRecentConversations();

}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openChat(user) {

    if (!user || !user.id) {
        return;
    }


    if (
        currentUser &&
        Number(user.id) ===
        Number(currentUser.id)
    ) {

        showToast(
            "You cannot chat with yourself.",
            "error"
        );

        return;

    }


    clearTypingState();


    activeChatUser = {
        ...user
    };


    addOrUpdateConversation(
        activeChatUser
    );


    showActiveChat();

    renderActiveChatHeader();

    showMessagesLoading();


    try {

        const response =
            await apiRequest(
                `/chat/${user.id}`
            );


        if (response.user) {

            activeChatUser = {

                ...activeChatUser,

                ...response.user

            };


            renderActiveChatHeader();


            addOrUpdateConversation(
                activeChatUser
            );

        }


        const messages =
            response.messages ||
            response.data ||
            [];


        renderMessages(
            messages
        );


    } catch (error) {

        console.error(
            "Load chat error:",
            error
        );

        showToast(
            error.message ||
            "Unable to load conversation.",
            "error"
        );

        renderMessages([]);

    } finally {

        hideMessagesLoading();

    }

}


/* =========================================================
   ACTIVE CHAT
========================================================= */

function showActiveChat() {

    if (
        chatElements.chatWelcome
    ) {

        chatElements.chatWelcome.classList.add(
            "hidden"
        );

    }


    if (
        chatElements.activeChat
    ) {

        chatElements.activeChat.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ACTIVE CHAT HEADER
========================================================= */

function renderActiveChatHeader() {

    if (!activeChatUser) {
        return;
    }


    const name =
        activeChatUser.name ||
        activeChatUser.username ||
        "User";


    const username =
        activeChatUser.username
            ? `@${activeChatUser.username}`
            : "";


    if (
        chatElements.activeUserName
    ) {

        chatElements.activeUserName.textContent =
            name;

    }


    if (
        chatElements.activeUserUsername
    ) {

        chatElements.activeUserUsername.textContent =
            username;

    }


    if (
        chatElements.activeUserAvatar
    ) {

        if (
            activeChatUser.profile_image
        ) {

            chatElements.activeUserAvatar.innerHTML = `
                <img
                    src="${escapeHTML(
                        activeChatUser.profile_image
                    )}"
                    alt="${escapeHTML(name)}"
                >
            `;

        } else {

            chatElements.activeUserAvatar.innerHTML = `
                <span id="activeUserInitials">
                    ${escapeHTML(
                        getInitials(name)
                    )}
                </span>
            `;

        }

    }

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

function showMessagesLoading() {

    if (
        !chatElements.messagesContainer
    ) {
        return;
    }


    /*
     * IMPORTANT:
     * Do not remove messagesLoading itself.
     * The old code cleared innerHTML and therefore
     * deleted the loading element from the DOM.
     */

    chatElements.messagesContainer.innerHTML = "";


    const loader =
        document.createElement("div");


    loader.className =
        "messages-loading";


    loader.id =
        "messagesLoading";


    loader.innerHTML = `
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        Loading messages...
    `;


    chatElements.messagesContainer.appendChild(
        loader
    );


    chatElements.messagesLoading =
        loader;

}


function hideMessagesLoading() {

    if (
        chatElements.messagesLoading
    ) {

        chatElements.messagesLoading.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages(messages) {

    if (
        !chatElements.messagesContainer
    ) {
        return;
    }


    chatElements.messagesContainer.innerHTML =
        "";


    if (
        !messages ||
        messages.length === 0
    ) {

        chatElements.messagesContainer.innerHTML = `
            <div class="chat-empty-state">

                <div class="chat-empty-icon">
                    <i class="fa-regular fa-comments"></i>
                </div>

                <h3>
                    Start the conversation
                </h3>

                <p>
                    Send a message to
                    ${escapeHTML(
                        activeChatUser?.name ||
                        "this user"
                    )}.
                </p>

            </div>
        `;

        return;

    }


    let lastDate = "";


    messages.forEach(
        message => {

            const date =
                new Date(
                    message.created_at
                );


            const dateLabel =
                getMessageDateLabel(
                    date
                );


            if (
                dateLabel !== lastDate
            ) {

                const divider =
                    document.createElement(
                        "div"
                    );


                divider.className =
                    "message-date-divider";


                divider.innerHTML = `
                    <span>
                        ${escapeHTML(
                            dateLabel
                        )}
                    </span>
                `;


                chatElements.messagesContainer.appendChild(
                    divider
                );


                lastDate =
                    dateLabel;

            }


            appendMessage(
                message
            );

        }
    );


    scrollMessagesToBottom();

}


/* =========================================================
   MESSAGE TIME
========================================================= */

function formatMessageTime(
    dateString
) {

    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   DATE LABEL
========================================================= */

function getMessageDateLabel(
    date
) {

    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    const today =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    const messageDate =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );


    const difference =
        Math.floor(
            (
                today -
                messageDate
            ) / 86400000
        );


    if (
        difference === 0
    ) {

        return "Today";

    }


    if (
        difference === 1
    ) {

        return "Yesterday";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   SCROLL
========================================================= */

function scrollMessagesToBottom() {

    if (
        !chatElements.messagesContainer
    ) {
        return;
    }


    requestAnimationFrame(
        () => {

            chatElements.messagesContainer.scrollTop =
                chatElements.messagesContainer.scrollHeight;

        }
    );

}


/* =========================================================
   COMPOSER
========================================================= */

function setComposerLoading(
    loading
) {

    if (
        chatElements.sendMessageBtn
    ) {

        chatElements.sendMessageBtn.disabled =
            loading;

    }

}


function autoResizeMessageInput() {

    const input =
        chatElements.messageInput;


    if (!input) {
        return;
    }


    input.style.height =
        "auto";


    input.style.height =
        `${Math.min(
            input.scrollHeight,
            140
        )}px`;

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleMessageKeydown(
    event
) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendCurrentMessage();

    }

}


/* =========================================================
   TYPING
========================================================= */

function handleMessageTyping() {

    autoResizeMessageInput();


    if (
        !socket ||
        !socket.connected ||
        !activeChatUser
    ) {

        return;

    }


    socket.emit(
        "typing",
        {

            receiver_id:
                Number(
                    activeChatUser.id
                ),

            is_typing: true

        }
    );


    clearTimeout(
        typingTimeout
    );


    typingTimeout =
        setTimeout(
            () => {

                if (
                    socket &&
                    socket.connected &&
                    activeChatUser
                ) {

                    socket.emit(
                        "typing",
                        {

                            receiver_id:
                                Number(
                                    activeChatUser.id
                                ),

                            is_typing: false

                        }
                    );

                }

            },
            1000
        );

}


function setTypingIndicator(
    visible
) {

    if (
        !chatElements.typingIndicator
    ) {
        return;
    }


    chatElements.typingIndicator.classList.toggle(
        "hidden",
        !visible
    );

}


/* =========================================================
   EMOJI
========================================================= */

function insertEmoji() {

    const input =
        chatElements.messageInput;


    if (!input) {
        return;
    }


    const emoji =
        "😊";


    const start =
        input.selectionStart;


    const end =
        input.selectionEnd;


    input.value =
        input.value.substring(
            0,
            start
        ) +
        emoji +
        input.value.substring(
            end
        );


    input.focus();


    input.selectionStart =
        input.selectionEnd =
            start + emoji.length;


    autoResizeMessageInput();

}


/* =========================================================
   SIDEBAR USER SEARCH
========================================================= */

function handleSidebarSearch(
    event
) {

    const query =
        event.target.value.trim();


    clearTimeout(
        searchTimeout
    );


    if (
        query.length < 2
    ) {

        hideSearchResults();

        renderRecentConversations();

        return;

    }


    searchTimeout =
        setTimeout(
            () => {

                searchPeople(
                    query,
                    chatElements.searchResults
                );

            },
            300
        );

}


async function searchPeople(
    query,
    container
) {

    if (!container) {
        return;
    }


    try {

        container.classList.remove(
            "hidden"
        );


        container.innerHTML = `
            <div class="search-loading">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                Searching...
            </div>
        `;


        const response =
            await searchUsers(
                query
            );


        const users =
            response.users ||
            response.data ||
            [];


        const filtered =
            users.filter(
                user =>
                    Number(user.id) !==
                    Number(currentUser?.id)
            );


        renderSearchResults(
            filtered,
            container
        );


    } catch (error) {

        console.error(
            "Search users error:",
            error
        );


        container.innerHTML = `
            <div class="search-no-results">
                Unable to search users.
            </div>
        `;

    }

}


/* =========================================================
   SEARCH RESULTS
========================================================= */

function renderSearchResults(
    users,
    container
) {

    container.innerHTML = "";


    if (!users.length) {

        container.innerHTML = `
            <div class="search-no-results">
                <i class="fa-regular fa-user"></i>
                <span>No users found.</span>
            </div>
        `;

        return;

    }


    users.forEach(
        user => {

            const item =
                createUserSearchItem(
                    user
                );


            container.appendChild(
                item
            );

        }
    );

}


function createUserSearchItem(
    user
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "user-search-result";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "search-user-avatar";


    if (
        user.profile_image
    ) {

        avatar.innerHTML = `
            <img
                src="${escapeHTML(
                    user.profile_image
                )}"
                alt="${escapeHTML(
                    user.name ||
                    user.username ||
                    "User"
                )}"
            >
        `;

    } else {

        avatar.textContent =
            getInitials(
                user.name ||
                user.username
            );

    }


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "search-user-info";


    const name =
        document.createElement(
            "strong"
        );


    name.textContent =
        user.name ||
        user.username ||
        "User";


    const username =
        document.createElement(
            "span"
        );


    username.textContent =
        user.username
            ? `@${user.username}`
            : "";


    info.appendChild(
        name
    );


    info.appendChild(
        username
    );


    button.appendChild(
        avatar
    );


    button.appendChild(
        info
    );


    button.addEventListener(
        "click",
        () => {

            hideSearchResults();

            if (
                chatElements.userSearchInput
            ) {

                chatElements.userSearchInput.value =
                    "";

            }

            openChat(
                user
            );

        }
    );


    return button;

}


function hideSearchResults() {

    if (
        chatElements.searchResults
    ) {

        chatElements.searchResults.classList.add(
            "hidden"
        );

        chatElements.searchResults.innerHTML =
            "";

    }

}


/* =========================================================
   NEW CHAT MODAL
========================================================= */

function openNewChatModal() {

    if (
        !chatElements.newChatModal
    ) {
        return;
    }


    chatElements.newChatModal.hidden =
        false;


    chatElements.newChatModal.classList.remove(
        "hidden"
    );


    if (
        chatElements.newChatSearchInput
    ) {

        chatElements.newChatSearchInput.value =
            "";

        setTimeout(
            () => {

                chatElements.newChatSearchInput.focus();

            },
            50
        );

    }


    if (
        chatElements.newChatResults
    ) {

        chatElements.newChatResults.innerHTML =
            `
            <div class="new-chat-empty">
                Search for someone to start chatting.
            </div>
            `;

    }

}


function closeNewChatModal() {

    if (
        !chatElements.newChatModal
    ) {
        return;
    }


    chatElements.newChatModal.hidden =
        true;


    chatElements.newChatModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   NEW CHAT SEARCH
========================================================= */

function handleNewChatSearch(
    event
) {

    const query =
        event.target.value.trim();


    clearTimeout(
        newChatSearchTimeout
    );


    if (
        query.length < 2
    ) {

        if (
            chatElements.newChatResults
        ) {

            chatElements.newChatResults.innerHTML =
                `
                <div class="new-chat-empty">
                    Search for someone to start chatting.
                </div>
                `;

        }

        return;

    }


    newChatSearchTimeout =
        setTimeout(
            () => {

                searchPeople(
                    query,
                    chatElements.newChatResults
                );

            },
            300
        );

}


/* =========================================================
   RECENT CONVERSATIONS
========================================================= */

function conversationStorageKey() {

    return currentUser
        ? `vibe_conversations_${currentUser.id}`
        : "vibe_conversations";

}


function loadRecentConversations() {

    try {

        const saved =
            localStorage.getItem(
                conversationStorageKey()
            );


        recentConversations =
            saved
                ? JSON.parse(saved)
                : [];


        if (
            !Array.isArray(
                recentConversations
            )
        ) {

            recentConversations = [];

        }

    } catch (error) {

        console.error(
            "Conversation storage error:",
            error
        );

        recentConversations = [];

    }

}


function saveRecentConversations() {

    try {

        localStorage.setItem(
            conversationStorageKey(),
            JSON.stringify(
                recentConversations
            )
        );

    } catch (error) {

        console.error(
            "Unable to save conversations:",
            error
        );

    }

}


/* =========================================================
   ADD / UPDATE CONVERSATION
========================================================= */

function addOrUpdateConversation(
    user
) {

    if (
        !user ||
        !user.id
    ) {
        return;
    }


    const userId =
        Number(user.id);


    recentConversations =
        recentConversations.filter(
            conversation =>
                Number(
                    conversation.id
                ) !== userId
        );


    recentConversations.unshift({

        id:
            userId,

        name:
            user.name ||
            user.username ||
            "User",

        username:
            user.username ||
            "",

        profile_image:
            user.profile_image ||
            null,

        last_message:
            user.last_message ||
            "",

        updated_at:
            user.updated_at ||
            new Date().toISOString()

    });


    recentConversations =
        recentConversations.slice(
            0,
            30
        );


    saveRecentConversations();

    renderRecentConversations();

}


/* =========================================================
   RENDER RECENT CONVERSATIONS
========================================================= */

function renderRecentConversations() {

    if (
        !chatElements.conversationList
    ) {
        return;
    }


    chatElements.conversationList.innerHTML =
        "";


    if (
        !recentConversations.length
    ) {

        chatElements.conversationList.innerHTML =
            `
            <div class="chat-sidebar-empty">

                <i class="fa-regular fa-comments"></i>

                <h3>
                    No conversations yet
                </h3>

                <p>
                    Start a conversation with someone on Vibe.
                </p>

            </div>
            `;

        return;

    }


    recentConversations.forEach(
        conversation => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "conversation-item";


            if (
                activeChatUser &&
                Number(
                    activeChatUser.id
                ) ===
                Number(
                    conversation.id
                )
            ) {

                button.classList.add(
                    "active"
                );

            }


            const avatar =
                document.createElement(
                    "div"
                );


            avatar.className =
                "conversation-avatar";


            if (
                conversation.profile_image
            ) {

                avatar.innerHTML = `
                    <img
                        src="${escapeHTML(
                            conversation.profile_image
                        )}"
                        alt="${escapeHTML(
                            conversation.name
                        )}"
                    >
                `;

            } else {

                avatar.textContent =
                    getInitials(
                        conversation.name
                    );

            }


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "conversation-content";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "conversation-name";


            name.textContent =
                conversation.name;


            const preview =
                document.createElement(
                    "div"
                );


            preview.className =
                "conversation-preview";


            preview.textContent =
                conversation.last_message ||
                "Start a conversation";


            content.appendChild(
                name
            );


            content.appendChild(
                preview
            );


            button.appendChild(
                avatar
            );


            button.appendChild(
                content
            );


            button.addEventListener(
                "click",
                () => {

                    openChat(
                        conversation
                    );

                }
            );


            chatElements.conversationList.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   TYPING HELPERS
========================================================= */

function clearTypingState() {

    clearTimeout(
        typingTimeout
    );


    if (
        socket &&
        socket.connected &&
        activeChatUser
    ) {

        socket.emit(
            "typing",
            {

                receiver_id:
                    Number(
                        activeChatUser.id
                    ),

                is_typing:
                    false

            }
        );

    }

}


/* =========================================================
   END
========================================================= */